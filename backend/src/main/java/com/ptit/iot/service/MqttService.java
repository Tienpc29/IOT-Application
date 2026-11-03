package com.ptit.iot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ptit.iot.entity.DataSensor;
import com.ptit.iot.entity.HistoryActive;
import com.ptit.iot.repository.DataSensorRepository;
import com.ptit.iot.repository.HistoryActiveRepository;
import com.ptit.iot.repository.SensorThresholdRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class MqttService implements MqttCallbackExtended {

    private static final Logger log = LoggerFactory.getLogger(MqttService.class);

    @Value("${mqtt.broker.url:tcp://localhost:1884}")
    private String brokerUrl;

    @Value("${mqtt.client.id:SpringBoot-PTIT-IoT-Server}")
    private String clientId;

    @Value("${mqtt.username:b23dccn823}")
    private String username;

    @Value("${mqtt.password:123456}")
    private String password;

    @Value("${mqtt.topic.sensor:data/sensor}")
    private String topicSensor;

    @Value("${mqtt.topic.control:device/control}")
    private String topicControl;

    @Value("${mqtt.topic.feedback:device/feedback}")
    private String topicFeedback;

    @Value("${sensor.light.adc.max:4095}")
    private double lightAdcMax;

    @Value("${sensor.light.lux.max:1000}")
    private double lightLuxMax;

    @Value("${mqtt.command.timeout-ms:10000}")
    private long commandTimeoutMs;

    @Value("${mqtt.hardware.timeout-ms:10000}")
    private long hardwareTimeoutMs;

    private final DataSensorRepository dataSensorRepository;
    private final HistoryActiveRepository historyActiveRepository;
    private final SensorThresholdRepository sensorThresholdRepository;
    private final ObjectMapper objectMapper;
    private final ScheduledExecutorService commandTimeoutExecutor =
            Executors.newScheduledThreadPool(1);

    private MqttClient mqttClient;
    private volatile long lastSensorMessageAt;
    private volatile boolean restoreStatesOnNextSensor = true;

    public MqttService(DataSensorRepository dataSensorRepository,
                       HistoryActiveRepository historyActiveRepository,
                       SensorThresholdRepository sensorThresholdRepository) {
        this.dataSensorRepository = dataSensorRepository;
        this.historyActiveRepository = historyActiveRepository;
        this.sensorThresholdRepository = sensorThresholdRepository;
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void init() {
        new Thread(this::connectMqtt).start();
    }

    private synchronized void connectMqtt() {
        try {
            log.info("Connecting to MQTT broker at {}", brokerUrl);
            mqttClient = new MqttClient(brokerUrl, clientId + "_" + System.currentTimeMillis(), new MemoryPersistence());
            mqttClient.setCallback(this);

            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(10);
            options.setKeepAliveInterval(30);

            if (username != null && !username.isBlank()) {
                options.setUserName(username);
            }
            if (password != null && !password.isBlank()) {
                options.setPassword(password.toCharArray());
            }

            mqttClient.connect(options);
            log.info("Connected to MQTT Broker successfully!");
            subscribeTopics();
        } catch (MqttException e) {
            log.error("Failed to connect to MQTT broker (will retry automatically if broker starts): {}", e.getMessage());
        }
    }

    private void subscribeTopics() {
        try {
            if (mqttClient != null && mqttClient.isConnected()) {
                mqttClient.subscribe(topicSensor, 1);
                mqttClient.subscribe(topicFeedback, 1);
                log.info("Subscribed to topics: '{}' and '{}'", topicSensor, topicFeedback);
            }
        } catch (MqttException e) {
            log.error("Error subscribing to topics: {}", e.getMessage());
        }
    }

    @Override
    public void connectComplete(boolean reconnect, String serverURI) {
        restoreStatesOnNextSensor = true;
        log.info("MQTT connection complete (reconnect={}) to {}", reconnect, serverURI);
        subscribeTopics();
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("MQTT connection lost: {}", cause != null ? cause.getMessage() : "Unknown");
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
        log.info("MQTT received on [{}]: {}", topic, payload);

        try {
            if (topic.equals(topicSensor)) {
                long now = System.currentTimeMillis();
                boolean hardwareReconnected = restoreStatesOnNextSensor
                        || lastSensorMessageAt == 0
                        || now - lastSensorMessageAt > hardwareTimeoutMs;
                lastSensorMessageAt = System.currentTimeMillis();
                handleSensorData(payload);
                if (hardwareReconnected) {
                    restoreDeviceStates();
                    restoreStatesOnNextSensor = false;
                }
            } else if (topic.equals(topicFeedback)) {
                handleDeviceFeedback(payload);
            }
        } catch (Exception e) {
            log.error("Error processing MQTT message: {}", e.getMessage(), e);
        }
    }

    private void handleSensorData(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            LocalDateTime now = LocalDateTime.now();

            // sensor 1: temperature
            if (root.has("temperature")) {
                double temp = root.get("temperature").asDouble();
                dataSensorRepository.save(new DataSensor(1, temp, now));
                evaluateThreshold(1, temp);
            }
            // sensor 2: humidity
            if (root.has("humidity")) {
                double hum = root.get("humidity").asDouble();
                dataSensorRepository.save(new DataSensor(2, hum, now));
                evaluateThreshold(2, hum);
            }
            // sensor 3: light
            if (root.has("light")) {
                double adc = root.get("light").asDouble();
                double lux = adcToLux(adc);
                dataSensorRepository.save(new DataSensor(3, lux, now));
                evaluateThreshold(3, lux);
                log.info("Converted light ADC {} to {} lux", adc, lux);
            }
            log.info("Saved sensor reading to database successfully at {}", now);
        } catch (Exception e) {
            log.error("Error parsing sensor payload: {}", e.getMessage());
        }
    }

    private void handleDeviceFeedback(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            int deviceId = root.path("device_id").asInt(1);
            String status = root.path("status").asText("ON").toUpperCase();

            HistoryActive history = historyActiveRepository
                    .findTopByDeviceIdAndStatusOrderByTimestampDesc(deviceId, "PENDING")
                    .orElseGet(HistoryActive::new);
            history.setDeviceId(deviceId);
            if (history.getAction() == null || history.getAction().isBlank()) {
                history.setAction("ON".equalsIgnoreCase(status) ? "TURN_ON" : "TURN_OFF");
            }
            if (history.getUsername() == null || history.getUsername().isBlank()) {
                history.setUsername("system");
            }
            history.setStatus("SUCCESS");
            history.setTimestamp(LocalDateTime.now());
            historyActiveRepository.save(history);

            log.info("Saved device feedback to history: deviceId={}, status={}", deviceId, status);
        } catch (Exception e) {
            log.error("Error parsing feedback payload: {}", e.getMessage());
        }
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
    }

    public boolean isMqttConnected() {
        return mqttClient != null && mqttClient.isConnected();
    }

    public boolean hasReceivedSensorData() {
        return lastSensorMessageAt > 0;
    }

    public boolean isHardwareConnected() {
        return hasReceivedSensorData()
                && System.currentTimeMillis() - lastSensorMessageAt <= hardwareTimeoutMs;
    }

    public long getLastSensorMessageAt() {
        return lastSensorMessageAt;
    }

    /**
     * Send command to control a single device
     * Payload: {"device_id": 1, "action": "TURN_ON"}
     */
    public boolean sendDeviceControl(int deviceId, String action, String username) {
        HistoryActive pending = savePending(deviceId, action, username);
        try {
            if (mqttClient == null || !mqttClient.isConnected()) {
                log.warn("MQTT client not connected, attempting reconnect...");
                connectMqtt();
            }

            String jsonPayload = String.format("{\"device_id\":%d,\"action\":\"%s\"}", deviceId, action);
            MqttMessage message = new MqttMessage(jsonPayload.getBytes(StandardCharsets.UTF_8));
            message.setQos(1);
            mqttClient.publish(topicControl, message);
            log.info("Sent control MQTT to [{}]: {}", topicControl, jsonPayload);

            return true;
        } catch (Exception e) {
            log.error("Failed to publish control message: {}", e.getMessage());
            return false;
        }
    }

    /** Send one state-preserving flash to a device. */
    public boolean sendBlink(int deviceId) {
        try {
            if (mqttClient == null || !mqttClient.isConnected()) {
                log.warn("MQTT client not connected, attempting reconnect before blink...");
                connectMqtt();
            }

            String jsonPayload = String.format("{\"device_id\":%d,\"action\":\"BLINK\"}", deviceId);
            MqttMessage message = new MqttMessage(jsonPayload.getBytes(StandardCharsets.UTF_8));
            message.setQos(1);
            mqttClient.publish(topicControl, message);
            log.info("Sent automatic blink to [{}]: {}", topicControl, jsonPayload);
            return true;
        } catch (Exception e) {
            log.error("Failed to publish automatic blink: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Send command to control all devices: "ALL_ON" or "ALL_OFF"
     */
    public boolean sendAllDevicesControl(String action, String username) {
        String payload = action.toUpperCase();
        String actionText = "ALL_ON".equalsIgnoreCase(payload) ? "TURN_ON" : "TURN_OFF";
        for (int devId = 1; devId <= 3; devId++) {
            savePending(devId, actionText, username);
        }
        try {
            if (mqttClient == null || !mqttClient.isConnected()) {
                log.warn("MQTT client not connected, attempting reconnect...");
                connectMqtt();
            }

            // Exactly "ALL_ON" or "ALL_OFF" plain text as expected by Arduino
            MqttMessage message = new MqttMessage(payload.getBytes(StandardCharsets.UTF_8));
            message.setQos(1);
            mqttClient.publish(topicControl, message);
            log.info("Sent ALL control MQTT to [{}]: {}", topicControl, payload);

            return true;
        } catch (Exception e) {
            log.error("Failed to publish all control message: {}", e.getMessage());
            return false;
        }
    }

    @PreDestroy
    public void cleanup() {
        commandTimeoutExecutor.shutdownNow();
        try {
            if (mqttClient != null && mqttClient.isConnected()) {
                mqttClient.disconnect();
                mqttClient.close();
            }
        } catch (MqttException e) {
            log.error("Error disconnecting MQTT client: {}", e.getMessage());
        }
    }

    private HistoryActive savePending(int deviceId, String action, String username) {
        HistoryActive pending = new HistoryActive();
        pending.setDeviceId(deviceId);
        pending.setUsername(username == null || username.isBlank() ? "system" : username);
        pending.setAction(action);
        pending.setStatus("PENDING");
        pending.setTimestamp(LocalDateTime.now());
        HistoryActive saved = historyActiveRepository.save(pending);
        commandTimeoutExecutor.schedule(() -> markFailedIfStillPending(saved.getId()),
                commandTimeoutMs, TimeUnit.MILLISECONDS);
        return saved;
    }

    private void markFailedIfStillPending(Long historyId) {
        historyActiveRepository.findById(historyId).ifPresent(history -> {
            if ("PENDING".equalsIgnoreCase(history.getStatus())) {
                history.setStatus("FAILED");
                history.setTimestamp(LocalDateTime.now());
                historyActiveRepository.save(history);
                log.warn("Device command timed out after {} ms: historyId={}", commandTimeoutMs, historyId);
            }
        });
    }

    private synchronized void evaluateThreshold(int sensorId, double value) {
        sensorThresholdRepository.findById(sensorId).ifPresent(setting -> {
            boolean exceeded = value > setting.getThreshold();

            if (!exceeded) {
                if (setting.isThresholdExceeded()) {
                    setting.setThresholdExceeded(false);
                    sensorThresholdRepository.save(setting);
                }
                return;
            }

            // Manual OFF means this device is not eligible for automatic blinking.
            // Keep the threshold unarmed so turning the device back ON can trigger
            // on the next sensor update if the value is still above the threshold.
            if (!isDeviceOnForAutomaticBlink(setting.getDeviceId())) {
                if (setting.isThresholdExceeded()) {
                    setting.setThresholdExceeded(false);
                    sensorThresholdRepository.save(setting);
                }
                return;
            }

            // Every sensor update is 2 seconds apart. While the value remains
            // above the threshold, send one new blink for each update.
            if (sendBlink(setting.getDeviceId())) {
                setting.setThresholdExceeded(true);
                long currentCount = setting.getBlinkCount() == null ? 0L : setting.getBlinkCount();
                setting.setBlinkCount(currentCount + 1);
                sensorThresholdRepository.save(setting);
            }
        });
    }

    private boolean isDeviceOnForAutomaticBlink(int deviceId) {
        boolean hasPendingTurnOff = historyActiveRepository
                .findTopByDeviceIdAndStatusOrderByTimestampDesc(deviceId, "PENDING")
                .map(history -> "TURN_OFF".equalsIgnoreCase(history.getAction()))
                .orElse(false);
        if (hasPendingTurnOff) return false;

        return historyActiveRepository
                .findTopByDeviceIdAndStatusInOrderByTimestampDesc(
                        deviceId, java.util.List.of("SUCCESS"))
                .map(HistoryActive::getAction)
                .map(action -> "TURN_ON".equalsIgnoreCase(action)
                        || "ALL_ON".equalsIgnoreCase(action))
                .orElse(false);
    }

    private void restoreDeviceStates() {
        log.info("Hardware reconnected; restoring confirmed device states");
        for (int deviceId = 1; deviceId <= 3; deviceId++) {
            String action = historyActiveRepository
                    .findTopByDeviceIdAndStatusInOrderByTimestampDesc(
                            deviceId, java.util.List.of("SUCCESS"))
                    .map(HistoryActive::getAction)
                    .orElse("TURN_OFF");
            sendDeviceControl(deviceId, "TURN_ON".equalsIgnoreCase(action)
                    ? "TURN_ON"
                    : "TURN_OFF", "system");
        }
    }

    private double adcToLux(double adc) {
        double boundedAdc = Math.max(0, Math.min(lightAdcMax, adc));
        double lux = (lightAdcMax - boundedAdc) * lightLuxMax / lightAdcMax;
        return Math.round(lux * 10.0) / 10.0;
    }
}

