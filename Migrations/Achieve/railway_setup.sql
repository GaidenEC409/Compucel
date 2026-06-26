SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `rol` enum('gerente','tecnico','mostrador') NOT NULL DEFAULT 'mostrador',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `username` (`username`)
);

CREATE TABLE IF NOT EXISTS `clientes` (
  `id_cliente` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cliente`)
);

CREATE TABLE IF NOT EXISTS `ordenes` (
  `id_orden` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `marca` varchar(50) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `compania` varchar(50) DEFAULT NULL,
  `imei_logico` varchar(50) DEFAULT NULL,
  `imei_impreso` varchar(50) DEFAULT NULL,
  `patron` varchar(100) DEFAULT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `estado` varchar(50) DEFAULT NULL,
  `motivo_cancelacion` text DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `marca_modelo` varchar(100) DEFAULT NULL,
  `falla_reportada` text DEFAULT NULL,
  `accesorios` varchar(255) DEFAULT NULL,
  `diagnostico_tecnico` text DEFAULT NULL,
  PRIMARY KEY (`id_orden`),
  KEY `id_cliente` (`id_cliente`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `ordenes_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `ordenes_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
);

CREATE TABLE IF NOT EXISTS `pagos` (
  `id_pago` int(11) NOT NULL AUTO_INCREMENT,
  `id_orden` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(50) DEFAULT 'efectivo',
  `fecha_pago` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pago`),
  KEY `id_orden` (`id_orden`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `pagos_orden` FOREIGN KEY (`id_orden`) REFERENCES `ordenes` (`id_orden`),
  CONSTRAINT `pagos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
);

CREATE TABLE IF NOT EXISTS `egresos` (
  `id_egreso` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `concepto` varchar(255) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `categoria` enum('refacciones','gastos_fijos','herramientas','otros') NOT NULL DEFAULT 'otros',
  `id_orden` int(11) DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_egreso`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_orden` (`id_orden`),
  CONSTRAINT `egresos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `egresos_orden` FOREIGN KEY (`id_orden`) REFERENCES `ordenes` (`id_orden`)
);

CREATE TABLE IF NOT EXISTS `fotos_ordenes` (
  `id_foto` int(11) NOT NULL AUTO_INCREMENT,
  `id_orden` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `url` varchar(500) NOT NULL,
  `public_id` varchar(255) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha_subida` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_foto`),
  KEY `id_orden` (`id_orden`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `fotos_orden` FOREIGN KEY (`id_orden`) REFERENCES `ordenes` (`id_orden`),
  CONSTRAINT `fotos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
);

CREATE TABLE IF NOT EXISTS `historial_movimientos` (
  `id_historial` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `accion` varchar(50) NOT NULL,
  `tabla_afectada` varchar(50) DEFAULT NULL,
  `id_registro_afectado` int(11) DEFAULT NULL,
  `detalles` text DEFAULT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historial`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `historial_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
);

CREATE TABLE IF NOT EXISTS `catalogos_marcas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `activo` tinyint(4) DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
);

CREATE TABLE IF NOT EXISTS `catalogos_modelos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_marca` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `activo` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `id_marca` (`id_marca`),
  CONSTRAINT `modelos_marca` FOREIGN KEY (`id_marca`) REFERENCES `catalogos_marcas` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `catalogos_companias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `activo` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
);

-- DATOS INICIALES
INSERT IGNORE INTO `usuarios` VALUES (1,'admin','$2b$10$bLAaT98MofUnVq/P.6iurOG7BgP2Ulqp84q3PlD0QbrjQTgpjcd/C','Administrador General','gerente',1,'2026-03-29 23:58:17');

INSERT IGNORE INTO `catalogos_marcas` (nombre) VALUES ('Samsung'),('Motorola'),('Apple'),('Xiaomi'),('Huawei'),('Oppo'),('ZTE'),('Realme');

INSERT IGNORE INTO `catalogos_companias` (nombre) VALUES ('Telcel'),('Movistar'),('AT&T'),('Unefon'),('T-Mobile'),('Verizon'),('Otro/Libre');

SET FOREIGN_KEY_CHECKS = 1;