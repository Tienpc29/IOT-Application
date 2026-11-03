USE `iot_application`;

CREATE TABLE IF NOT EXISTS `sensor_threshold` (
    `sensor_id` INT PRIMARY KEY,
    `device_id` INT NOT NULL UNIQUE,
    `threshold` DOUBLE NOT NULL,
    `blink_count` BIGINT NOT NULL DEFAULT 0,
    `threshold_exceeded` BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT `fk_threshold_sensor`
        FOREIGN KEY (`sensor_id`) REFERENCES `sensor` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_threshold_device`
        FOREIGN KEY (`device_id`) REFERENCES `device` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `sensor_threshold`
    (`sensor_id`, `device_id`, `threshold`, `blink_count`, `threshold_exceeded`)
VALUES
    (1, 1, 35.0, 0, FALSE),
    (2, 2, 80.0, 0, FALSE),
    (3, 3, 700.0, 0, FALSE);
