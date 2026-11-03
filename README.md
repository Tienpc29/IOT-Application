# Hệ thống IoT giám sát cảm biến và điều khiển thiết bị

Hệ thống sử dụng ESP32 để đọc nhiệt độ, độ ẩm, ánh sáng ADC và điều khiển 3 LED. Dữ liệu được truyền qua MQTT đến backend, lưu vào MySQL và hiển thị trên frontend ReactJS.

## 1. Kiến trúc

```text
DHT11 + LDR + LED
        │
       ESP32
        │ MQTT
        ▼
Mosquitto Broker
        │
        ▼
Backend Node.js
   ├── Lưu MySQL
   ├── REST API
   └── Socket.IO realtime
        │
        ▼
   Frontend ReactJS
```

Hệ thống có hai sequence chính:

1. Điều khiển thiết bị.
2. Đọc và lưu dữ liệu cảm biến.

Login là chức năng bổ sung để bảo vệ các màn hình của hệ thống.

## 2. Công nghệ

- Frontend: ReactJS, Vite, Chart.js, React Router.
- Backend: Node.js, Express, MQTT.js, Socket.IO.
- Database: MySQL 8.x.
- Message broker: Mosquitto.
- Hardware: ESP32 Dev Module, DHT11, LDR 4 chân và 3 LED.

## 3. Cấu trúc thư mục

```text
iot-ptit-fe-reactjs/
├── src/                         # Frontend React hiện tại
│   ├── components/
│   ├── data/                    # Dữ liệu mock cũ
│   ├── pages/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── backend/
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
├── docs/
│   ├── API.md
│   ├── MQTT.md
│   ├── PROJECT_STRUCTURE.md
│   └── SETUP.md
├── package.json
└── README.md
```

## 4. Phần cứng

| Thành phần | GPIO |
|---|---:|
| DHT11 OUT | 4 |
| LDR AO | 34 |
| LED1 | 18 |
| LED2 | 19 |
| LED3 | 21 |

Trạng thái LED:

```text
HIGH = ON
LOW  = OFF
```

ESP32 gửi ánh sáng dạng ADC từ `0–4095` qua MQTT. Backend quy đổi gần đúng sang lux trước khi lưu vào `data_sensor`; với module LDR hiện tại, ánh sáng tăng thì giá trị ADC thường giảm.

## 5. Database

Database gồm 5 bảng chính:

```text
user
sensor
device
data_sensor
history_active
```

Tạo database và bảng bằng `database/schema.sql`. Thêm dữ liệu cảm biến và thiết bị bằng `database/seed.sql`.

Quan hệ chính:

```text
sensor 1 ─── N data_sensor
device 1 ─── N history_active
user    ─── Login và Profile
```

## 6. MQTT

ESP32 và laptop chạy Mosquitto phải cùng mạng WiFi hoặc hotspot.

### Sensor: ESP32 → Backend

Topic:

```text
data/sensor
```

Payload:

```json
{
  "temperature": 30.8,
  "humidity": 68,
  "light": 1850
}
```

### Điều khiển: Backend → ESP32

Topic:

```text
device/control
```

Payload:

```json
{
  "device_id": 1,
  "action": "TURN_ON"
}
```

### Feedback: ESP32 → Backend

Topic:

```text
device/feedback
```

Payload:

```json
{
  "device_id": 1,
  "status": "ON"
}
```

Trong MQTT bắt buộc dùng `device_id`. Không đổi thành `id`, `device` hoặc `deviceId`.

## 7. Phân biệt HTTP `id` và MQTT `device_id`

Đây là hai ngữ cảnh khác nhau.

HTTP API điều khiển dùng `id` trên URL:

```http
POST /api/devices/1/actions
```

Request body:

```json
{
  "action": "TURN_ON"
}
```

Backend ánh xạ `:id` của URL sang payload MQTT có `device_id`:

```json
{
  "device_id": 1,
  "action": "TURN_ON"
}
```

Không đổi endpoint thành `/api/devices/{device_id}/actions`.

## 8. API chính

```text
POST /api/login
GET  /api/profile
GET  /api/sensors/latest
GET  /api/sensors
GET  /api/devices
POST /api/devices/:id/actions
GET  /api/device-history
GET  /api/health
```

Các API ngoài `/api/login` yêu cầu header:

```http
Authorization: Bearer <token>
```

Chi tiết request/response xem tại [docs/API.md](docs/API.md).

## 9. Cài đặt MySQL

1. Cài MySQL Server và MySQL Workbench.
2. Mở Workbench và chạy `database/schema.sql`.
3. Chạy tiếp `database/seed.sql`.
4. Không chạy lại `schema.sql` để xóa dữ liệu; nếu cần reset có chủ đích, dùng `database/reset-database.sql` sau khi backup.
5. Tạo user MySQL riêng cho backend.

Ví dụ:

```sql
CREATE USER 'iot_app'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON iot_application.* TO 'iot_app'@'localhost';
FLUSH PRIVILEGES;
```

Không dùng tài khoản `root` trong backend khi triển khai thực tế.

## 10. Cài đặt backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

Mở `backend/.env` và cập nhật thông tin MySQL, MQTT:

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=iot_ptit
DB_USER=iot_app
DB_PASSWORD=your_password

MQTT_URL=mqtt://127.0.0.1:1884
MQTT_USERNAME=query
MQTT_PASSWORD=123456
```

Backend chạy mặc định tại `http://localhost:3000`.

## 11. Cài đặt frontend

Từ thư mục gốc:

```powershell
npm install
npm run dev
```

Frontend chạy tại `http://localhost:5173`.

Frontend hiện vẫn giữ dữ liệu mock cũ để giao diện có thể chạy độc lập. Khi backend hoàn thiện, các page sẽ được chuyển sang dùng API thật.

## 12. Cài đặt Arduino

1. Cài Arduino IDE.
2. Thêm ESP32 Board Package.
3. Cài các thư viện `PubSubClient`, `DHT sensor library` và `ArduinoJson`.
4. Mở `arduino/esp32_sensor/esp32_sensor.ino`.
5. Cập nhật WiFi và IP laptop:

```cpp
const char* WIFI_SSID = "CHANGE_ME";
const char* WIFI_PASSWORD = "CHANGE_ME";
const char* MQTT_HOST = "CHANGE_TO_LAPTOP_IP";
```

IP laptop có thể thay đổi khi đổi WiFi/hotspot, vì vậy không nên coi `172.20.10.2` là IP cố định vĩnh viễn.

## 13. Kiểm tra từng tầng

### Database

Đăng nhập được bằng Workbench và thấy đủ 5 bảng.

### MQTT

Dùng MQTT Explorer:

```text
Subscribe: data/sensor
Subscribe: device/feedback
Publish: device/control
```

### Backend

```text
GET http://localhost:3000/api/health
```

### Toàn bộ hệ thống

```text
Cảm biến → ESP32 → MQTT → Backend → MySQL → Frontend
Frontend → Backend → MQTT → ESP32 → Feedback → Frontend
```

## 14. Quy tắc không được tự thay đổi

- Không đổi MQTT topic.
- Không đổi field MQTT `device_id`.
- Không đổi endpoint `/api/devices/:id/actions`.
- Không đổi tên 5 bảng database.
- Không đổi GPIO phần cứng.
- Không đổi hai sequence chính.
- Không xem giá trị ADC thô là lux; giá trị hiển thị/lưu trong database là lux gần đúng.
- Không tự thêm Auto mode, relay, nhiều ESP32, role Admin/User hoặc cloud deployment nếu chưa có yêu cầu.
