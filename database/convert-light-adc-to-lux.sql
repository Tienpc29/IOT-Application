-- Chạy một lần sau khi backup nếu data_sensor.sensor_id = 3 hiện đang lưu ADC.
-- Công thức phải giống sensor.light.* trong application.properties.
-- Không chạy lại file này sau khi dữ liệu đã được chuyển sang lux.

USE `iot_application`;

UPDATE `data_sensor`
SET `value` = ROUND((4095 - `value`) * 1000 / 4095, 1)
WHERE `sensor_id` = 3
  AND `value` BETWEEN 0 AND 4095;
