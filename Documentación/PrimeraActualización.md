# Documentación de Diseño y Especificaciones Funcionales

## Proyecto: Compucel System - Módulo de Gestión de Órdenes v2.0

**Fecha:** 11 de Febrero de 2026
**Estado:** Propuesta de Diseño / En Desarrollo

---

## 1. Introducción y Propósito

El objetivo de esta actualización es transformar el registro de órdenes de una captura plana de datos a un **sistema relacional e inteligente**. Buscamos optimizar el tiempo de recepción de equipos, reducir errores humanos (typos) y aumentar el control administrativo sobre el flujo de trabajo del taller.

El principio rector de este diseño es: **"Escribir menos, controlar más"**.

---

## 2. Mejoras de UX/UI (Experiencia de Usuario)

### 2.1. Precisión Temporal

Actualmente, el sistema solo registra la fecha. Para evitar disputas con clientes sobre tiempos de entrega o recepción, se implementará un registro exacto.

- **Cambio:** Visualización de `Fecha + Hora` en el Dashboard.
- **Formato:** `DD/MM/AAAA · HH:MM hrs`.

### 2.2. Búsqueda Inteligente de Clientes (Smart Search)

Para agilizar la recepción de clientes recurrentes, se eliminará la necesidad de reescribir datos ya existentes.

- **Componente:** _ComboBox_ con autocompletado (tipo "Live Search").
- **Comportamiento:**
  1.  El usuario comienza a escribir el nombre en el campo "Cliente".
  2.  Se despliega una lista de coincidencias desde la base de datos.
  3.  Al seleccionar un cliente, **automáticamente se rellena el campo "Teléfono"** con el último dato registrado.
- **Actualización de Datos:** El campo de teléfono permanece editable. Si el usuario modifica el número pre-cargado, el sistema entenderá que es una actualización de contacto y guardará el nuevo número al confirmar la orden.

### 2.3. Categorización de Equipos

Se estandariza la entrada de datos de los dispositivos para permitir futuros reportes estadísticos (ej. _"¿Qué marca reparamos más?"_).

- **Separación:** El campo único "Equipo" se divide en dos:
  - **Marca:** (Ej. Samsung, Motorola, Apple).
  - **Modelo:** (Ej. Galaxy A54, Moto G7).
- **Sugerencias:** Ambos campos sugerirán datos previamente ingresados para mantener consistencia en la nomenclatura.

---

## 3. Lógica de Negocio y Control Administrativo

### 3.1. Gestión de Cancelaciones

Se prohíbe la eliminación física de registros para mantener la integridad del historial.

- **Flujo:**
  1.  Acción "Cancelar" disponible en el Dashboard.
  2.  **Requisito Obligatorio:** Seleccionar o escribir un "Motivo de Cancelación".
  3.  El estado de la orden cambia a `CANCELADO`.
  4.  El registro permanece visible para auditoría pero inactivo para operaciones.

### 3.2. Catálogos Predefinidos (Configuración)

Para evitar inconsistencias (ej. "Pantalla rota", "Display roto", "Vidrio roto"), se implementan catálogos administrables.

- **Panel de Configuración (Solo Admin):**
  - **Fallas Comunes:** Lista predefinida seleccionable en la creación de la orden.
  - **Motivos de Cancelación:** Lista estandarizada.
  - **Gestión de Usuarios:** Creación de perfiles para Técnicos y Administradores.

---

## 4. Arquitectura de Datos y Transaccionalidad

### 4.1. Flujo de Guardado (The "Save" Logic)

Al hacer clic en **"Registrar Orden"**, el sistema no debe simplemente insertar una fila en la tabla de órdenes. Debe seguir un proceso transaccional para asegurar la integridad de la base de datos relacional.

**Secuencia de Ejecución:**

1.  **Validación/Upsert Cliente:**
    - _¿El cliente existe?_
      - **SÍ:** Compara el teléfono actual con el ingresado. Si es diferente, actualiza el registro del cliente (`UPDATE`).
      - **NO:** Crea un nuevo registro en la tabla `Clientes` (`INSERT`).
2.  **Validación Dispositivo:**
    - Verifica la asociación del modelo con la marca.

3.  **Creación de la Orden:**
    - Una vez asegurados los IDs del Cliente y los datos del Equipo, se genera la Orden vinculando estos registros.
    - Esto garantiza que una orden siempre apunte a un cliente válido y actualizado.

---

## 5. Resumen de Impacto

Con estos cambios, **Compucel System** deja de ser una simple bitácora digital para convertirse en un **ERP (Enterprise Resource Planning)** ligero, capaz de gestionar la relación con el cliente (CRM básico) y el flujo operativo del taller de manera profesional.
