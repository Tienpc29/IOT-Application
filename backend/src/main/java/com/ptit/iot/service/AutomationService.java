package com.ptit.iot.service;

import com.ptit.iot.dto.SensorThresholdRequest;
import com.ptit.iot.entity.SensorThreshold;
import com.ptit.iot.repository.SensorThresholdRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AutomationService {

    private static final Map<Integer, Integer> DEVICE_BY_SENSOR = Map.of(1, 1, 2, 2, 3, 3);
    private static final Map<Integer, Double> DEFAULT_THRESHOLDS = Map.of(1, 35.0, 2, 80.0, 3, 700.0);

    private final SensorThresholdRepository repository;

    public AutomationService(SensorThresholdRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void ensureDefaultSettings() {
        for (Map.Entry<Integer, Integer> entry : DEVICE_BY_SENSOR.entrySet()) {
            if (repository.findById(entry.getKey()).isEmpty()) {
                repository.save(new SensorThreshold(
                        entry.getKey(), entry.getValue(), DEFAULT_THRESHOLDS.get(entry.getKey())));
            }
        }
    }

    public List<SensorThreshold> getAll() {
        ensureDefaultSettings();
        return repository.findAllByOrderBySensorIdAsc();
    }

    public List<SensorThreshold> update(List<SensorThresholdRequest> requests) {
        if (requests == null || requests.size() != 3) {
            throw new IllegalArgumentException("Cần nhập đủ ngưỡng cho 3 cảm biến");
        }

        java.util.Set<Integer> sensorIds = requests.stream()
                .map(SensorThresholdRequest::getSensorId)
                .collect(java.util.stream.Collectors.toSet());
        if (!sensorIds.equals(DEVICE_BY_SENSOR.keySet())) {
            throw new IllegalArgumentException("Cần nhập đúng 3 cảm biến");
        }

        for (SensorThresholdRequest request : requests) {
            Integer sensorId = request.getSensorId();
            Double threshold = request.getThreshold();
            if (!DEVICE_BY_SENSOR.containsKey(sensorId)
                    || threshold == null
                    || !Double.isFinite(threshold)
                    || threshold < 0) {
                throw new IllegalArgumentException("Ngưỡng cảm biến không hợp lệ");
            }

            SensorThreshold setting = repository.findById(sensorId)
                    .orElseGet(() -> new SensorThreshold(
                            sensorId, DEVICE_BY_SENSOR.get(sensorId), threshold));
            setting.setThreshold(threshold);
            // A new threshold starts a fresh threshold-crossing cycle.
            setting.setThresholdExceeded(false);
            repository.save(setting);
        }
        return getAll();
    }
}
