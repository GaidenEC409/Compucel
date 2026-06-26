-- =====================================================
-- MIGRACIÓN: Módulo de Egresos para CompucelSystem
-- Ejecutar en tu base de datos taller_celulares
-- =====================================================

USE taller_celulares;

-- 1. Nueva tabla de egresos
CREATE TABLE IF NOT EXISTS `egresos` (
  `id_egreso`   INT            NOT NULL AUTO_INCREMENT,
  `id_usuario`  INT            NOT NULL,
  `concepto`    VARCHAR(255)   NOT NULL,
  `monto`       DECIMAL(10,2)  NOT NULL,
  `categoria`   ENUM('refacciones','gastos_fijos','herramientas','otros') NOT NULL DEFAULT 'otros',
  `id_orden`    INT            DEFAULT NULL,
  `fecha`       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_egreso`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  FOREIGN KEY (`id_orden`)   REFERENCES `ordenes`  (`id_orden`)
);

-- 2. Agrega el permiso en la lógica (no necesita tabla,
--    solo recuerda actualizar Permisos.tsx con "registrar_egresos")

-- 3. (Opcional) Datos de prueba para ver en reportes
-- INSERT INTO egresos (id_usuario, concepto, monto, categoria) VALUES
--   (1, 'Pantalla Samsung A54', 350.00, 'refacciones'),
--   (1, 'Pago de luz', 420.00, 'gastos_fijos'),
--   (1, 'Pinzas de precisión', 180.00, 'herramientas'),
--   (1, 'Pantalla iPhone 11', 890.00, 'refacciones'),
--   (1, 'Renta del local', 2500.00, 'gastos_fijos');