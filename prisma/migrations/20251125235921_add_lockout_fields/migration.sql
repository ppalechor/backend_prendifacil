-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `failed_attempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lock_until` DATETIME(3) NULL;
