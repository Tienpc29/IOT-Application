# MQTT contract

Broker là Mosquitto chạy trên laptop.

## Sensor: ESP32 → Backend

Topic bắt buộc: `data/sensor`

```json
{
  "temperature": 30.8,
  "humidity": 68,
  "light": 1850
}
```

`light` ESP32 gửi là ADC, thường trong khoảng 0–4095. Backend quy đổi giá trị này sang lux gần đúng trước khi lưu database và hiển thị.

## Control: Backend → ESP32

Topic bắt buộc: `device/control`

```json
{
  "device_id": 1,
  "action": "TURN_ON"
}
```

Trong MQTT bắt buộc dùng `device_id`.

## Feedback: ESP32 → Backend

Topic bắt buộc: `device/feedback`

```json
{
  "device_id": 1,
  "status": "ON"
}
```

Mapping thiết bị:

```text
device_id 1 → GPIO18
device_id 2 → GPIO19
device_id 3 → GPIO21
```
