-- CreateTable
CREATE TABLE `usuarios` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `identificacion` VARCHAR(191) NOT NULL,
    `nombres` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,

    UNIQUE INDEX `usuarios_identificacion_key`(`identificacion`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipos_articulos` (
    `id_tipo_articulo` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `tipos_articulos_nombre_key`(`nombre`),
    PRIMARY KEY (`id_tipo_articulo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empenos` (
    `id_empeno` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `fecha_empeno` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `descripcion` VARCHAR(191) NULL,
    `estado` ENUM('ACTIVO', 'INACTIVO', 'FINALIZADO') NOT NULL DEFAULT 'ACTIVO',

    PRIMARY KEY (`id_empeno`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articulos` (
    `id_articulo` INTEGER NOT NULL AUTO_INCREMENT,
    `empeno_id` INTEGER NOT NULL,
    `tipo_articulo_id` INTEGER NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `valor_avaluo` DOUBLE NOT NULL,
    `estado` ENUM('EMPENADO', 'RETIRADO') NOT NULL DEFAULT 'EMPENADO',

    PRIMARY KEY (`id_articulo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prestamos` (
    `id_prestamo` INTEGER NOT NULL AUTO_INCREMENT,
    `empeno_id` INTEGER NOT NULL,
    `fecha_prestamo` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `valor` DOUBLE NOT NULL,
    `estado` ENUM('ACTIVO', 'PAGADO', 'VENCIDO') NOT NULL DEFAULT 'ACTIVO',

    UNIQUE INDEX `prestamos_empeno_id_key`(`empeno_id`),
    PRIMARY KEY (`id_prestamo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `intereses` (
    `id_interes` INTEGER NOT NULL AUTO_INCREMENT,
    `prestamo_id` INTEGER NOT NULL,
    `mes` INTEGER NOT NULL,
    `valor` DOUBLE NOT NULL,
    `fecha_interes` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` ENUM('PENDIENTE', 'PAGADO') NOT NULL DEFAULT 'PENDIENTE',

    UNIQUE INDEX `intereses_prestamo_id_mes_key`(`prestamo_id`, `mes`),
    PRIMARY KEY (`id_interes`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `empenos` ADD CONSTRAINT `empenos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articulos` ADD CONSTRAINT `articulos_empeno_id_fkey` FOREIGN KEY (`empeno_id`) REFERENCES `empenos`(`id_empeno`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articulos` ADD CONSTRAINT `articulos_tipo_articulo_id_fkey` FOREIGN KEY (`tipo_articulo_id`) REFERENCES `tipos_articulos`(`id_tipo_articulo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prestamos` ADD CONSTRAINT `prestamos_empeno_id_fkey` FOREIGN KEY (`empeno_id`) REFERENCES `empenos`(`id_empeno`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intereses` ADD CONSTRAINT `intereses_prestamo_id_fkey` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos`(`id_prestamo`) ON DELETE RESTRICT ON UPDATE CASCADE;
