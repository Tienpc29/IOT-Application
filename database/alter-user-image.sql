-- Mo rong dung luong luu anh Base64 cho tai khoan.
USE `iot_application`;

ALTER TABLE `user`
    MODIFY COLUMN `image` MEDIUMTEXT DEFAULT NULL;
