# Local setup

## MySQL

1. Cài MySQL Server và Workbench.
2. Mở `database/schema.sql` bằng Workbench và chạy.
3. Chạy `database/seed.sql`.
4. Không chạy lại `schema.sql` để reset dữ liệu; file này hiện chỉ tạo bảng nếu chưa có.
5. Chỉ dùng `database/reset-database.sql` khi muốn xóa toàn bộ dữ liệu và đã backup.

## Backend

```powershell
cd backend
mvn spring-boot:run
```

Backend mặc định chạy ở `http://localhost:8080`.

## MQTT

Mosquitto phải lắng nghe ở port `1884`, có tài khoản `query`, và cho phép laptop nhận kết nối từ ESP32. Đổi `MQTT_HOST` trong Arduino thành IP hiện tại của laptop; không dùng IP cố định khi đổi mạng.

## Arduino

Mở `arduino/esp32_sensor/esp32_sensor.ino`, điền WiFi và IP laptop, sau đó nạp vào ESP32 Dev Module.
