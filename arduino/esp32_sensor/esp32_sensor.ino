#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ==============================
// CAM BIEN
// ==============================
#define DHT_PIN 4
#define DHT_TYPE DHT11
#define LIGHT_PIN 34

// ==============================
// LED
// ==============================
#define LED1 18
#define LED2 19
#define LED3 21

// ==============================
// WIFI
// ==============================
const char* WIFI_SSID = "Tiendeptrai";
const char* WIFI_PASSWORD = "tttttttt";

// ==============================
// MQTT
// ==============================
const char* MQTT_HOST = "172.20.10.2";
const int MQTT_PORT = 1884;

const char* MQTT_USERNAME = "b23dccn823";
const char* MQTT_PASSWORD = "123456";

// ==============================
// TOPIC
// ==============================
const char* TOPIC_SENSOR = "data/sensor";
const char* TOPIC_CONTROL = "device/control";
const char* TOPIC_FEEDBACK = "device/feedback";

// ==============================
// DOI TUONG
// ==============================
DHT dht(DHT_PIN, DHT_TYPE);

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastSensorTime = 0;

// Trạng thái nháy không blocking để MQTT vẫn nhận được lệnh điều khiển.
bool blinkActive[3] = {false, false, false};
bool blinkLightOn[3] = {false, false, false};
bool blinkOriginalState[3] = {false, false, false};
unsigned long blinkStartedAt[3] = {0, 0, 0};
bool automaticBlinkEnabled[3] = {false, false, false};

// ==================================================
// GUI FEEDBACK LED
// ==================================================
void sendFeedback(int deviceId, const char* status) {
  JsonDocument doc;
  doc["device_id"] = deviceId;
  doc["status"] = status;

  char json[100];
  serializeJson(doc, json);

  mqttClient.publish(TOPIC_FEEDBACK, json);
  Serial.print("Feedback: ");
  Serial.println(json);
}

void setLed(int pin, bool isOn) {
  digitalWrite(pin, isOn ? HIGH : LOW);
}

int pinForDevice(int deviceId) {
  if (deviceId == 1) return LED1;
  if (deviceId == 2) return LED2;
  if (deviceId == 3) return LED3;
  return 0;
}

void cancelBlink(int deviceId) {
  if (deviceId >= 1 && deviceId <= 3) {
    blinkActive[deviceId - 1] = false;
  }
}

void setAutomaticBlinkEnabled(int deviceId, bool enabled) {
  if (deviceId < 1 || deviceId > 3) return;

  automaticBlinkEnabled[deviceId - 1] = enabled;
  if (!enabled) cancelBlink(deviceId);
}

// One blink is OFF -> ON for 1 second. The original manual state is restored afterwards.
void startBlink(int deviceId, int pin) {
  int index = deviceId - 1;
  if (index < 0 || index >= 3 || blinkActive[index]) return;

  if (!automaticBlinkEnabled[index]) {
    Serial.print("BLINK ignored - device is OFF: ");
    Serial.println(deviceId);
    return;
  }

  blinkActive[index] = true;
  blinkLightOn[index] = false;
  blinkOriginalState[index] = digitalRead(pin) == HIGH;
  blinkStartedAt[index] = millis();
  setLed(pin, false);
  Serial.print("BLINK started - device ");
  Serial.println(deviceId);
}

void updateBlinks() {
  for (int index = 0; index < 3; index++) {
    if (!blinkActive[index]) continue;

    int deviceId = index + 1;
    int pin = pinForDevice(deviceId);
    unsigned long elapsed = millis() - blinkStartedAt[index];

    if (!blinkLightOn[index] && elapsed >= 500) {
      setLed(pin, true);
      blinkLightOn[index] = true;
    }

    if (elapsed >= 1000) {
      setLed(pin, blinkOriginalState[index]);
      blinkActive[index] = false;
      blinkLightOn[index] = false;
      Serial.print("BLINK finished - device ");
      Serial.println(deviceId);
    }
  }
}

// ==================================================
// NHAN LENH MQTT
// ==================================================
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Control received: ");
  Serial.println(message);

  // ==================================================
  // BAT TAT TAT CA LED
  // ==================================================
  if (message == "ALL_ON") {
    setAutomaticBlinkEnabled(1, true);
    setAutomaticBlinkEnabled(2, true);
    setAutomaticBlinkEnabled(3, true);
    cancelBlink(1);
    cancelBlink(2);
    cancelBlink(3);
    setLed(LED1, true);
    setLed(LED2, true);
    setLed(LED3, true);

    sendFeedback(1, "ON");
    sendFeedback(2, "ON");
    sendFeedback(3, "ON");
    return;
  }

  if (message == "ALL_OFF") {
    setAutomaticBlinkEnabled(1, false);
    setAutomaticBlinkEnabled(2, false);
    setAutomaticBlinkEnabled(3, false);
    cancelBlink(1);
    cancelBlink(2);
    cancelBlink(3);
    setLed(LED1, false);
    setLed(LED2, false);
    setLed(LED3, false);

    sendFeedback(1, "OFF");
    sendFeedback(2, "OFF");
    sendFeedback(3, "OFF");
    return;
  }

  // ==================================================
  // DIEU KHIEN TUNG LED
  // ==================================================
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("JSON Error: ");
    Serial.println(error.c_str());
    return;
  }

  int deviceId = doc["device_id"];
  String action = doc["action"];

  int pin = pinForDevice(deviceId);
  if (pin == 0) return;

  if (action == "BLINK") {
    startBlink(deviceId, pin);
  } else if (action == "TURN_ON") {
    setAutomaticBlinkEnabled(deviceId, true);
    cancelBlink(deviceId);
    setLed(pin, true);
    sendFeedback(deviceId, "ON");
  } else if (action == "TURN_OFF") {
    setAutomaticBlinkEnabled(deviceId, false);
    cancelBlink(deviceId);
    setLed(pin, false);
    sendFeedback(deviceId, "OFF");
  }
}

// ==================================================
// KET NOI WIFI
// ==================================================
void connectWiFi() {
  Serial.print("Dang ket noi WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi da ket noi!");
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());
}

// ==================================================
// KET NOI MQTT
// ==================================================
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Dang ket noi MQTT Broker...");
    String clientId = "ESP32-Client-" + String((uint32_t)ESP.getEfuseMac(), HEX);

    if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println(" Thanh cong!");
      mqttClient.subscribe(TOPIC_CONTROL);
      Serial.print("Da subscribe topic: ");
      Serial.println(TOPIC_CONTROL);
    } else {
      Serial.print(" That bai, rc=");
      Serial.print(mqttClient.state());
      Serial.println(". Thu lai sau 3 giay...");
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  dht.begin();

  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED3, OUTPUT);

  digitalWrite(LED1, LOW);
  digitalWrite(LED2, LOW);
  digitalWrite(LED3, LOW);

  connectWiFi();

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(callback);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!mqttClient.connected()) {
    connectMQTT();
  }

  mqttClient.loop();
  updateBlinks();

  // Doc cam bien moi 2 giay
  if (millis() - lastSensorTime >= 2000) {
    lastSensorTime = millis();

    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    int light = analogRead(LIGHT_PIN);

    if (isnan(temp) || isnan(hum)) {
      Serial.println("Loi doc cam bien DHT11!");
      return;
    }

    JsonDocument doc;
    doc["temperature"] = temp;
    doc["humidity"] = hum;
    doc["light"] = light;

    char json[120];
    serializeJson(doc, json);

    mqttClient.publish(TOPIC_SENSOR, json);

    Serial.print("Sensor data: ");
    Serial.println(json);
  }
}
