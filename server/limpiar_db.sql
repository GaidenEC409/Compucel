-- Desactivar foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar tablas operativas
TRUNCATE TABLE historial_movimientos;
TRUNCATE TABLE fotos_ordenes;
TRUNCATE TABLE pagos;
TRUNCATE TABLE egresos;
TRUNCATE TABLE ordenes;
TRUNCATE TABLE clientes;

-- Limpiar usuarios de prueba (deja solo el admin)
DELETE FROM usuarios WHERE id_usuario != 1;

-- Reactivar foreign keys
SET FOREIGN_KEY_CHECKS = 1;