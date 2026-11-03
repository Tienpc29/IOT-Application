# Cấu trúc hệ thống

FE cũ vẫn nằm ở thư mục gốc của repository hiện tại. Các phần mới được tách riêng:

```text
iot-ptit-fe-reactjs/
├── src/                         # FE React cũ
├── backend/                     # Node.js + Express + MQTT + MySQL
│   ├── src/
│   │   ├── config/
│   │   ├── database/
│   │   ├── middleware/
│   │   ├── mqtt/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── database/
│   ├── schema.sql
│   └── seed.sql
├── arduino/
│   └── esp32_sensor/esp32_sensor.ino
└── docs/
    ├── PROJECT_STRUCTURE.md
    ├── API.md
    └── MQTT.md
```

## Hai sequence chính

1. Điều khiển thiết bị: FE → Backend → `device/control` → ESP32 → `device/feedback` → Backend → FE.
2. Đọc cảm biến: DHT11/LDR → ESP32 → `data/sensor` → Backend → `data_sensor` → FE.

Login là chức năng bổ sung, dùng `POST /api/login`, không thay đổi hai sequence chính.
