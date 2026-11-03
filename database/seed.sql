-- Dữ liệu khởi tạo an toàn cho database iot_application.
-- Chạy sau schema.sql. Có thể chạy lại mà không tạo bản ghi trùng.

USE `iot_application`;

-- Tài khoản mặc định. INSERT IGNORE giữ nguyên mật khẩu/profile nếu tài khoản đã tồn tại.
INSERT IGNORE INTO `user`
    (`id`, `username`, `password`, `name`, `image`, `github`, `figma`, `msv`, `postman`, `pdf`)
VALUES
    (1, 'admin', '123456', 'Phan Công Tiến', '', 'https://github.com/', 'https://www.figma.com/', 'B23DCCN823', 'https://web.postman.co/', '/bao-cao-iot.pdf');

-- Danh mục cảm biến.
INSERT IGNORE INTO `sensor` (`id`, `name`) VALUES
    (1, 'Nhiệt độ'),
    (2, 'Độ ẩm'),
    (3, 'Ánh sáng');

-- Danh mục thiết bị.
INSERT IGNORE INTO `device` (`id`, `name`) VALUES
    (1, 'Đèn 1'),
    (2, 'Đèn 2'),
    (3, 'Đèn 3');

-- Không seed data_sensor/history_active:
-- các bản ghi này phải đến từ ESP32 và feedback MQTT thực tế.
