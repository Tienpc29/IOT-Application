# HỆ THỐNG BACKEND SPRING BOOT - DỰ ÁN IoT PTIT

## 1. Tổng quan kiến trúc
- **Framework:** Spring Boot 3.2.5 (Java 17)
- **Database:** MySQL 8.0+ (Database: `iot_application`)
- **MQTT Protocol:** Eclipse Paho Client (`1.2.5`)
- **MQTT Broker:** Mosquitto (port `1884`)
- **Firmware:** ESP32 Dev Module

---

## 2. Cấu hình kết nối (`application.properties`)

```properties
server.port=8080

# 1. MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/iot_application?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true&characterEncoding=UTF-8
spring.datasource.username=root
spring.datasource.password=123456

# 2. MQTT Mosquitto
mqtt.broker.url=tcp://localhost:1884
# Hoặc IP mạng LAN nếu chạy khác máy: tcp://172.20.10.2:1884
mqtt.client.id=SpringBoot-PTIT-IoT-Server
mqtt.username=b23dccn823
mqtt.password=123456

# MQTT Topics
mqtt.topic.sensor=data/sensor
mqtt.topic.control=device/control
mqtt.topic.feedback=device/feedback
```

---

## 3. Danh sách toàn bộ REST API Endpoints

### 3.1. Xác thực (Authentication)

| Method | Endpoint | Mô tả | Request Body | Response JSON |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập tài khoản | `{"username": "admin", "password": "..."}` | `{"success": true, "message": "...", "user": {...}}` |
| `POST` | `/api/auth/logout` | Đăng xuất | Không | `{"success": true, "message": "Đăng xuất thành công!"}` |

### 3.2. Profile sinh viên

| Method | Endpoint | Mô tả | Request Body | Response JSON |
|---|---|---|---|---|
| `GET` | `/api/user/profile?username=admin` | Lấy profile | Không | `{"id": 1, "username": "admin", "name": "...", "msv": "B23DCCN823", ...}` |
| `PUT` | `/api/user/profile?username=admin` | Cập nhật profile | `{"name": "...", "msv": "...", "github": "...", ...}` | Trả về ProfileDTO đã cập nhật |

### 3.3. Dữ liệu cảm biến (Data Sensor & Dashboard)

| Method | Endpoint | Mô tả | Request Params | Response JSON |
|---|---|---|---|---|
| `GET` | `/api/sensors/latest` | Lấy giá trị mới nhất của Nhiệt độ, Độ ẩm, Ánh sáng (lux gần đúng) | Không | `{"temperature": 28.5, "humidity": 65.0, "light": 332.0, "timestamp": "2026-10-17 08:00:00"}` |
| `GET` | `/api/sensors/chart` | Dữ liệu vẽ biểu đồ Dashboard | Không | Mảng `[{"time": "08:00:00", "temperature": 28.5, "humidity": 65, "light": 520}, ...]` |
| `GET` | `/api/sensor-data` | Danh sách lịch sử cảm biến (phân trang, lọc) | `sensorId`, `from`, `to`, `page`, `size` | `{"content": [...], "page": 0, "size": 10, "totalElements": 100, "totalPages": 10}` |

### 3.4. Thiết bị & Lịch sử Điều khiển (Device & Active History)

| Method | Endpoint | Mô tả | Request Body | Response JSON |
|---|---|---|---|---|
| `GET` | `/api/devices` | Danh sách 3 đèn & trạng thái hiện tại | Không | `[{"id": 1, "name": "Đèn 1", "status": "ON"}, ...]` |
| `POST` | `/api/devices/{id}/action` | Bật/tắt 1 đèn | `{"action": "TURN_ON"}` hoặc `{"action": "TURN_OFF"}` | `{"success": true, "message": "...", "deviceId": 1, "action": "TURN_ON"}` |
| `POST` | `/api/devices/all/action` | Bật/tắt cả 3 đèn | `{"action": "ALL_ON"}` hoặc `{"action": "ALL_OFF"}` | `{"success": true, "message": "...", "action": "ALL_ON"}` |
| `GET` | `/api/device-history` | Lịch sử thao tác thiết bị (phân trang, lọc) | `deviceId`, `status`, `from`, `to`, `page`, `size` | `{"content": [...], "page": 0, "size": 10, "totalElements": 50, "totalPages": 5}` |

---

## 4. Các Topic MQTT và Quy chuẩn Payload

1. **`data/sensor`** (ESP32 -> Spring Boot):
   - Chu kỳ: 2 giây/lần.
   - Payload:
     ```json
     {
       "temperature": 28.5,
       "humidity": 65.0,
       "light": 520
     }
     ```
   - Spring Boot tự động bóc tách và lưu 3 bản ghi vào bảng `data_sensor` (sensor_id 1, 2, 3).

2. **`device/control`** (Spring Boot -> ESP32):
   - Đèn đơn lẻ:
     ```json
     {"device_id": 1, "action": "TURN_ON"}
     ```
     hoặc
     ```json
     {"device_id": 1, "action": "TURN_OFF"}
     ```
   - Tất cả đèn: Chuỗi văn bản thuần túy `ALL_ON` hoặc `ALL_OFF`.

3. **`device/feedback`** (ESP32 -> Spring Boot):
   - Payload:
     ```json
     {"device_id": 1, "status": "ON"}
     ```
   - Spring Boot tự động lưu vào bảng `history_active` với trạng thái `ON` (Thành công) hoặc `OFF`.

---

## 5. Hướng dẫn chạy Backend

### Cách 1: Chạy bằng IntelliJ IDEA / Eclipse / VS Code
1. Mở thư mục `backend` trong IntelliJ IDEA hoặc Eclipse.
2. IDE sẽ tự nhận diện dự án Maven và tải thư viện.
3. Chạy class: `com.ptit.iot.IotApplication`.

### Cách 2: Chạy bằng dòng lệnh Maven
```bash
cd backend
mvn spring-boot:run
```
Backend sẽ khởi động tại địa chỉ: `http://localhost:8080`

