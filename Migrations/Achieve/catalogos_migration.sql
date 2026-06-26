-- Marcas de celulares
CREATE TABLE IF NOT EXISTS catalogos_marcas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  activo TINYINT DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modelos anidados por marca
CREATE TABLE IF NOT EXISTS catalogos_modelos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_marca INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  activo TINYINT DEFAULT 1,
  FOREIGN KEY (id_marca) REFERENCES catalogos_marcas(id) ON DELETE CASCADE
);

-- Compañías/Operadoras
CREATE TABLE IF NOT EXISTS catalogos_companias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  activo TINYINT DEFAULT 1
);

-- Datos iniciales (los que ya tenías hardcodeados en NuevaOrden.tsx)
INSERT IGNORE INTO catalogos_marcas (nombre) VALUES 
  ('Samsung'), ('Motorola'), ('Apple'), ('Xiaomi'), 
  ('Huawei'), ('Oppo'), ('ZTE');

INSERT IGNORE INTO catalogos_companias (nombre) VALUES 
  ('Telcel'), ('Movistar'), ('AT&T'), ('Unefon'), 
  ('T-Mobile'), ('Verizon'), ('Otro/Libre');