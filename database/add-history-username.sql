-- Chay mot lan de lam sach lich su cu va them nguoi thuc hien.
-- Chi xoa du lieu trong history_active, khong xoa data_sensor.
USE `iot_application`;

ALTER TABLE `history_active`
    ADD COLUMN `username` VARCHAR(50) DEFAULT NULL AFTER `device_id`;

DELETE FROM `history_active`;

ALTER TABLE `history_active` AUTO_INCREMENT = 1;
