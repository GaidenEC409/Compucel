-- CompucelSystem - Schema completo
USE taller_celulares;

CREATE TABLE `usuarios` (
  `id_usuario`      INT            NOT NULL AUTO_INCREMENT,
  `username`        VARCHAR(50)    NOT NULL UNIQUE,
  `password`        VARCHAR(255)   NOT NULL,
  `nombre_completo` VARCHAR(100)   NOT NULL,
  `rol`             ENUM('gerente','tecnico','mostrador') NOT NULL DEFAULT 'mostrador',
  `activo`          TINYINT(1)     NOT NULL DEFAULT 1,
  `fecha_creacion`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`)
);

CREATE TABLE `clientes` (
  `id_cliente`     INT          NOT NULL AUTO_INCREMENT,
  `nombre`         VARCHAR(100) NOT NULL,
  `telefono`       VARCHAR(20)  DEFAULT NULL,
  `direccion`      TEXT         DEFAULT NULL,
  `fecha_registro` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cliente`)
);

CREATE TABLE `ordenes` (
  `id_orden`            INT            NOT NULL AUTO_INCREMENT,
  `id_cliente`          INT            NOT NULL,
  `id_usuario`          INT            NOT NULL,
  `marca`               VARCHAR(50)    DEFAULT NULL,
  `modelo`              VARCHAR(100)   DEFAULT NULL,
  `compania`            VARCHAR(50)    DEFAULT NULL,
  `imei_logico`         VARCHAR(50)    DEFAULT NULL,
  `imei_impreso`        VARCHAR(50)    DEFAULT NULL,
  `patron`              VARCHAR(100)   DEFAULT NULL,
  `total`               DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `estado`              VARCHAR(50)    DEFAULT NULL,
  `motivo_cancelacion`  TEXT           DEFAULT NULL,
  `fecha_creacion`      DATETIME       DEFAULT CURRENT_TIMESTAMP,
  `marca_modelo`        VARCHAR(100)   DEFAULT NULL,
  `falla_reportada`     TEXT           DEFAULT NULL,
  `accesorios`          VARCHAR(255)   DEFAULT NULL,
  `diagnostico_tecnico` TEXT           DEFAULT NULL,
  PRIMARY KEY (`id_orden`),
  FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
);

CREATE TABLE `pagos` (
  `id_pago`     INT           NOT NULL AUTO_INCREMENT,
  `id_orden`    INT           NOT NULL,
  `id_usuario`  INT           NOT NULL,
  `monto`       DECIMAL(10,2) NOT NULL,
  `metodo_pago` VARCHAR(50)   DEFAULT 'efectivo',
  `fecha_pago`  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pago`),
  FOREIGN KEY (`id_orden`)   REFERENCES `ordenes`  (`id_orden`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
);

CREATE TABLE `historial_movimientos` (
  `id_historial`         INT         NOT NULL AUTO_INCREMENT,
  `id_usuario`           INT         NOT NULL,
  `accion`               VARCHAR(50) NOT NULL,
  `tabla_afectada`       VARCHAR(50) DEFAULT NULL,
  `id_registro_afectado` INT         DEFAULT NULL,
  `detalles`             TEXT        DEFAULT NULL,
  `fecha`                DATETIME    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historial`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
);

-- Usuarios de prueba
INSERT INTO `usuarios` (username, password, nombre_completo, rol) VALUES
  ('admin',      'admin123',      'Administrador General', 'gerente'),
  ('tecnico1',   'tec123',        'Juan Pérez (Técnico)',  'tecnico'),
  ('mostrador1', 'mostrador123',  'Ana López (Mostrador)', 'mostrador');
