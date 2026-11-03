-- ====================================================================
-- CƠ SỞ DỮ LIỆU DỰ ÁN IoT (PTIT)
-- Database Name: iot_application
-- Hệ quản trị: MySQL 8.0+
-- ====================================================================

-- 1. Tạo Database
CREATE DATABASE IF NOT EXISTS `iot_application` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `iot_application`;

-- ====================================================================
-- 3. TẠO CÁC BẢNG DỮ LIỆU
-- ====================================================================

-- Bảng 1: user (Quản lý thông tin tài khoản & profile sinh viên)
CREATE TABLE IF NOT EXISTS `user` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `image` MEDIUMTEXT DEFAULT NULL,
    `github` VARCHAR(255) DEFAULT NULL,
    `figma` VARCHAR(255) DEFAULT NULL,
    `msv` VARCHAR(50) DEFAULT NULL,
    `postman` VARCHAR(500) DEFAULT NULL,
    `pdf` VARCHAR(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 2: sensor (Danh mục cảm biến)
CREATE TABLE IF NOT EXISTS `sensor` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 3: data_sensor (Lưu dữ liệu đo từ các cảm biến theo thời gian)
CREATE TABLE IF NOT EXISTS `data_sensor` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `sensor_id` INT NOT NULL,
    `value` DOUBLE NOT NULL,
    `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_data_sensor_sensor` 
        FOREIGN KEY (`sensor_id`) REFERENCES `sensor` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_data_sensor_timestamp` (`timestamp`),
    INDEX `idx_data_sensor_sensor_time` (`sensor_id`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 4: device (Danh mục thiết bị điều khiển - 3 đèn LED)
CREATE TABLE IF NOT EXISTS `device` (
    `id` INT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 5: sensor_threshold (Ngưỡng tự động và số lần nháy của từng đèn)
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

CREATE TABLE IF NOT EXISTS `history_active` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `device_id` INT NOT NULL,
    `username` VARCHAR(50) DEFAULT NULL,
    `action` VARCHAR(50) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_history_device` 
        FOREIGN KEY (`device_id`) REFERENCES `device` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_history_timestamp` (`timestamp`),
    INDEX `idx_history_device_time` (`device_id`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu khởi tạo nằm trong database/seed.sql.
-- Không chèn dữ liệu đo mẫu ở đây để tránh làm bẩn dữ liệu thật.
