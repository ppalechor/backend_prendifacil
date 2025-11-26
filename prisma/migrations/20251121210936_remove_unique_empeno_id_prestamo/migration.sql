-- DropForeignKey
ALTER TABLE `prestamos` DROP FOREIGN KEY `prestamos_empeno_id_fkey`;

-- DropIndex
DROP INDEX `prestamos_empeno_id_key` ON `prestamos`;
