-- CẢNH BÁO: file này xóa toàn bộ dữ liệu trong database iot_application.
-- Chỉ chạy khi muốn reset dự án và đã backup dữ liệu.

USE `iot_application`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `history_active`;
DROP TABLE IF EXISTS `data_sensor`;
DROP TABLE IF EXISTS `device`;
DROP TABLE IF EXISTS `sensor`;
DROP TABLE IF EXISTS `user`;
SET FOREIGN_KEY_CHECKS = 1;
