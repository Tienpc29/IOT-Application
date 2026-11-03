-- Them truong luu link Postman va bao cao cho Profile.
USE `iot_application`;

ALTER TABLE `user`
    ADD COLUMN `postman` VARCHAR(500) DEFAULT NULL AFTER `msv`,
    ADD COLUMN `pdf` VARCHAR(500) DEFAULT NULL AFTER `postman`;

UPDATE `user`
SET
    `postman` = COALESCE(`postman`, 'https://web.postman.co/'),
    `pdf` = COALESCE(`pdf`, '/bao-cao-iot.pdf')
WHERE `id` IS NOT NULL;
