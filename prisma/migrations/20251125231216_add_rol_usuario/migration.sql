/*
  Warnings:

  - A unique constraint covering the columns `[empeno_id]` on the table `prestamos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `rol` ENUM('ADMIN', 'CLIENTE') NOT NULL DEFAULT 'CLIENTE';

-- CreateIndex
CREATE UNIQUE INDEX `prestamos_empeno_id_key` ON `prestamos`(`empeno_id`);

-- AddForeignKey
ALTER TABLE `prestamos` ADD CONSTRAINT `prestamos_empeno_id_fkey` FOREIGN KEY (`empeno_id`) REFERENCES `empenos`(`id_empeno`) ON DELETE RESTRICT ON UPDATE CASCADE;
