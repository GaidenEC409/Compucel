# Especificación Técnica de Base de Datos: Sistema de Gestión y Trazabilidad

**Versión del Documento:** 1.0
**Última Actualización:** 10 de Febrero de 2026
**Propósito:** Definir la estructura, integridad y lógica de negocio del esquema de base de datos para garantizar la seguridad, auditoría y escalabilidad del sistema.

---

## 1. Filosofía de Arquitectura

El diseño de esta base de datos se aleja de un simple almacenamiento de datos para convertirse en un sistema de **Registro de Autoridad**. Se han priorizado tres pilares fundamentales:

1.  **No Repudio (Non-Repudiation):** Cada acción crítica (venta, cobro, cambio de estado) está firmada criptográficamente o referencialmente por un usuario único. Nadie puede negar haber realizado una acción registrada.
2.  **Inmutabilidad Histórica (Soft Deletes):** La información financiera y operativa nunca se destruye. Los usuarios y registros no se eliminan (`DELETE`), solo se desactivan. Esto garantiza que los reportes financieros del pasado sigan siendo consistentes en el futuro.
3.  **Auditoría Centralizada:** Un mecanismo de "Caja Negra" que registra los cambios de estado, permitiendo reconstruir la historia de cualquier objeto del sistema en caso de error o disputa.

---

## 2. Definición Detallada de Tablas (Schema Definition)

A continuación, se detalla la estructura física de las tablas y la justificación estratégica de cada campo.

### 2.1 Tabla: `usuarios` (Gestión de Identidad)

_El núcleo de seguridad del sistema. Controla quién puede acceder y qué nivel de permisos tiene._

| Campo             | Tipo           | Restricciones         | Justificación Estratégica                                                                                                                                  |
| :---------------- | :------------- | :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`id_usuario`**  | `INT`          | `PK`, `AUTO_INC`      | Identificador único e inmutable.                                                                                                                           |
| `username`        | `VARCHAR(50)`  | `UNIQUE`, `NOT NULL`  | Identificador de login. Se usa en lugar del email para agilizar la operación en entornos locales/intranet.                                                 |
| `password`        | `VARCHAR(255)` | `NOT NULL`            | **Seguridad:** Almacena el _hash_ (ej. bcrypt/argon2), nunca el texto plano. Longitud 255 para soportar algoritmos robustos futuros.                       |
| `nombre_completo` | `VARCHAR(100)` | `NOT NULL`            | **UX:** Permite personalizar la interfaz y los reportes impresos (ej. "Atendido por: Juan Pérez").                                                         |
| `rol`             | `ENUM`         | `'admin', 'operador'` | **RBAC:** Base para el Control de Acceso Basado en Roles. Permite escalar la UI mostrando u ocultando módulos según el privilegio.                         |
| `activo`          | `TINYINT(1)`   | `DEFAULT 1`           | **Integridad:** _Soft Delete_. Si un empleado es despedido, se pasa a `0`. Esto impide su acceso pero mantiene intacto el historial de sus ventas pasadas. |
| `fecha_creacion`  | `DATETIME`     | `DEFAULT NOW()`       | Auditoría de RRHH.                                                                                                                                         |

---

### 2.2 Tabla: `clientes` (CRM Básico)

_Entidad pasiva que recibe los servicios o productos._

| Campo            | Tipo           | Restricciones    | Justificación Estratégica                                                        |
| :--------------- | :------------- | :--------------- | :------------------------------------------------------------------------------- |
| **`id_cliente`** | `INT`          | `PK`, `AUTO_INC` | Identificador único.                                                             |
| `nombre`         | `VARCHAR(100)` | `NOT NULL`       | Nombre fiscal o comercial del cliente.                                           |
| `telefono`       | `VARCHAR(20)`  | `NULL`           | Canal de contacto principal.                                                     |
| `direccion`      | `TEXT`         | `NULL`           | Datos logísticos para entregas o facturación.                                    |
| `fecha_registro` | `DATETIME`     | `DEFAULT NOW()`  | Permite análisis de cohortes (ej. "¿Cuántos clientes nuevos captamos en 2025?"). |

---

### 2.3 Tabla: `ordenes` (Transacción Principal)

_Representa la intención de compra o servicio. Conecta al Cliente con el Usuario que genera la venta._

| Campo            | Tipo            | Restricciones                        | Justificación Estratégica                                                                                            |
| :--------------- | :-------------- | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **`id_orden`**   | `INT`           | `PK`, `AUTO_INC`                     | Número de folio interno.                                                                                             |
| `id_cliente`     | `INT`           | `FK`                                 | Vincula la venta a un cliente específico.                                                                            |
| `id_usuario`     | `INT`           | `FK`                                 | **Trazabilidad:** Registra quién _abrió_ o _creó_ la orden. Fundamental para cálculo de comisiones.                  |
| `total`          | `DECIMAL(10,2)` | `DEFAULT 0.00`                       | Almacena el valor final de la transacción monetaria.                                                                 |
| `estado`         | `ENUM`          | `'pendiente', 'pagada', 'cancelada'` | **Máquina de Estados:** Controla el flujo de vida de la orden. Impide que se entregue mercancía si no está 'pagada'. |
| `fecha_creacion` | `DATETIME`      | `DEFAULT NOW()`                      | Fecha contable de la operación.                                                                                      |

---

### 2.4 Tabla: `pagos` (Transacción Financiera)

_Separada de `ordenes` para permitir flexibilidad financiera (pagos parciales, múltiples métodos, o distintos cajeros)._

| Campo         | Tipo            | Restricciones        | Justificación Estratégica                                                                                                                                    |
| :------------ | :-------------- | :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`id_pago`** | `INT`           | `PK`, `AUTO_INC`     | Identificador único del movimiento de dinero.                                                                                                                |
| `id_orden`    | `INT`           | `FK`                 | Relaciona el dinero con la venta original.                                                                                                                   |
| `id_usuario`  | `INT`           | `FK`                 | **Auditoría de Caja:** Crucial. El usuario que crea la orden (vendedor) no siempre es el que cobra (cajero). Este campo dice quién recibió el dinero físico. |
| `monto`       | `DECIMAL(10,2)` | `NOT NULL`           | Cantidad exacta recibida en este movimiento.                                                                                                                 |
| `metodo_pago` | `VARCHAR(50)`   | `DEFAULT 'efectivo'` | Permite arqueos de caja diferenciados (Efectivo vs Tarjeta vs Transferencia).                                                                                |
| `fecha_pago`  | `DATETIME`      | `DEFAULT NOW()`      | Momento exacto del ingreso (Cash flow).                                                                                                                      |

---

### 2.5 Tabla: `historial_movimientos` (Sistema de Auditoría - Log)

_La "Caja Negra". Tabla de solo escritura (Append-Only) para depuración y seguridad forense._

| Campo              | Tipo            | Restricciones    | Justificación Estratégica                                                                                                                        |
| :----------------- | :-------------- | :--------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| **`id_historial`** | `INT`           | `PK`, `AUTO_INC` | Secuencial del evento.                                                                                                                           |
| `id_usuario`       | `INT`           | `FK (Nullable)`  | El actor que disparó el evento. Si el usuario se elimina físicamente (lo cual no recomendamos), este campo queda NULL pero el registro persiste. |
| `accion`           | `VARCHAR(50)`   | `NOT NULL`       | Verbo de la acción: `LOGIN`, `CREAR_ORDEN`, `ELIMINAR_PAGO`.                                                                                     |
| `tabla_afectada`   | `VARCHAR(50)`   | `NULL`           | Contexto del evento (ej. 'ordenes').                                                                                                             |
| `id_registro`      | `INT`           | `NULL`           | ID específico del objeto manipulado (ej. ID de la orden 504).                                                                                    |
| `detalles`         | `TEXT` / `JSON` | `NULL`           | **Payload de Reversión:** Aquí se guarda el estado anterior ("Valor previo: 500") o detalles técnicos. Permite funciones de "Deshacer".          |
| `fecha`            | `DATETIME`      | `DEFAULT NOW()`  | Timestamp forense.                                                                                                                               |

---

## 3. Relaciones y Diagrama Lógico

La integridad referencial está forzada mediante `FOREIGN KEYS`. Esto impide errores comunes como:

- Crear una orden para un cliente que no existe.
- Registrar un pago asociado a una orden fantasma.
- Que una orden "pierda" a su creador.

**Mapa de Dependencias:**

1.  `usuarios` y `clientes` son entidades independientes (Maestras).
2.  `ordenes` depende de `usuarios` y `clientes`.
3.  `pagos` depende de `ordenes` y `usuarios`.
4.  `historial_movimientos` observa a todas las anteriores.

---

## 4. Guía de Implementación Futura (Escalabilidad)

### 4.1 ¿Cómo agregar nuevos módulos?

Gracias a la tabla `historial_movimientos` polimórfica (basada en `tabla_afectada` + `id_registro`), si mañana agregas un módulo de **Inventario**, no necesitas crear una tabla de auditoría nueva. Simplemente insertas en el historial:

- `accion`: 'AJUSTE_STOCK'
- `tabla_afectada`: 'inventario'
- `detalles`: 'Producto X bajó de 10 a 9'

### 4.2 Reportes Inteligentes

Gracias a la separación de `ordenes` y `pagos` con `id_usuario` independiente en cada una, en el futuro podrás generar reportes de rendimiento muy específicos:

- _Ventas por Vendedor:_ `SELECT SUM(total) FROM ordenes WHERE id_usuario = X`
- _Dinero Recaudado por Cajero:_ `SELECT SUM(monto) FROM pagos WHERE id_usuario = Y`

---

## 5. Script SQL de Referencia (Schema Actual)

```sql
-- TABLAS MAESTRAS
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    rol ENUM('admin', 'operador') DEFAULT 'operador',
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABLAS TRANSACCIONALES
CREATE TABLE ordenes (
    id_orden INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_usuario INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    estado ENUM('pendiente', 'pagada', 'cancelada') DEFAULT 'pendiente',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE pagos (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    id_usuario INT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    metodo_pago VARCHAR(50) DEFAULT 'efectivo',
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_orden) REFERENCES ordenes(id_orden),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- TABLA DE AUDITORÍA
CREATE TABLE historial_movimientos (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50),
    id_registro_afectado INT,
    detalles TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);
```
