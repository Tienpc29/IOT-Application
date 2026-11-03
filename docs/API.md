# API contract

HTTP API dùng `:id` trên URL. Đây là route parameter của HTTP, không đổi thành `device_id`.

## Authentication

```http
POST /api/login
Content-Type: application/json

{"username":"...","password":"..."}
```

Response thành công gồm `token` và `user`. Các API còn lại dùng:

```http
Authorization: Bearer <token>
```

## Sensors

```text
GET /api/sensors/latest
GET /api/sensors?type=Temperature&page=1&limit=30&from=...&to=...
```

Response lịch sử gồm `id`, `sensor_id`, `sensor_name`, `value`, `timestamp`.

## Devices

```text
GET /api/devices
POST /api/devices/:id/actions
```

Request điều khiển chỉ có:

```json
{"action":"TURN_ON"}
```

Ví dụ `POST /api/devices/1/actions` sẽ được backend chuyển thành MQTT payload có `device_id: 1`.

## History/Profile

```text
GET /api/device-history?page=1&limit=30
GET /api/profile
```
