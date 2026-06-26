// index.js
const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");
const app = express();
const PORT = process.env.PORT || 3001;

const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "compucel/ordenes",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, quality: "auto" }],
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
const path = require("path");

app.use(express.static(path.join(__dirname, "../client/dist")));

// --- HISTORIAL ---
async function registrarHistorial(
  idUsuario,
  accion,
  tabla,
  idRegistro,
  detalles,
) {
  try {
    await db.query(
      "INSERT INTO historial_movimientos (id_usuario, accion, tabla_afectada, id_registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)",
      [idUsuario, accion, tabla, idRegistro, JSON.stringify(detalles)],
    );
  } catch (error) {
    console.error("Error historial:", error);
  }
}

// 1. LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await db.query(
      "SELECT id_usuario, username, nombre_completo, rol, password FROM usuarios WHERE username = ? AND activo = 1",
      [username],
    );
    if (users.length === 0)
      return res
        .status(401)
        .json({ success: false, message: "Credenciales incorrectas" });

    const usuario = users[0];
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida)
      return res
        .status(401)
        .json({ success: false, message: "Credenciales incorrectas" });

    await registrarHistorial(
      usuario.id_usuario,
      "LOGIN",
      "usuarios",
      usuario.id_usuario,
      "Inicio de sesión",
    );
    const { password: _, ...usuarioSinPassword } = usuario;
    res.json({ success: true, user: usuarioSinPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. DASHBOARD
app.get("/ordenes", async (req, res) => {
  try {
    const [ordenes] = await db.query(`
      SELECT 
        o.id_orden, 
        c.nombre as cliente, 
        CASE 
            WHEN o.marca IS NOT NULL AND o.marca != '' THEN CONCAT(o.marca, ' ', o.modelo)
            ELSE o.marca_modelo
        END as marca_modelo,
        o.estado, 
        o.fecha_creacion,
        u.username as recibido_por
      FROM ordenes o
      JOIN clientes c ON o.id_cliente = c.id_cliente
      JOIN usuarios u ON o.id_usuario = u.id_usuario
      ORDER BY o.id_orden DESC
    `);
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. DETALLES DE ORDEN
app.get("/ordenes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [ordenData] = await db.query(
      `
      SELECT 
        o.id_orden, 
        o.id_cliente,
        o.fecha_creacion,
        o.estado,
        o.falla_reportada,
        o.accesorios,
        o.diagnostico_tecnico,
        o.total,
        IFNULL(o.imei_logico, '')    as imei_logico,
        IFNULL(o.imei_impreso, '')   as imei_impreso,
        IFNULL(o.imei2, '')          as imei2,
        IFNULL(o.numero_serie, '')   as numero_serie,
        IFNULL(o.compania, '')       as compania,
        IFNULL(o.tipo_equipo, 'celular') as tipo_equipo,
        IFNULL(o.patron, '')         as patron,
        IFNULL(o.motivo_cancelacion, '') as motivo_cancelacion,
        CASE 
            WHEN o.marca IS NOT NULL AND o.marca != '' THEN CONCAT(o.marca, ' ', o.modelo)
            ELSE o.marca_modelo
        END as marca_modelo,
        IFNULL(o.marca, '')  as marca,
        IFNULL(o.modelo, '') as modelo,
        c.nombre    as cliente, 
        c.telefono, 
        u.nombre_completo as vendedor
      FROM ordenes o
      JOIN clientes c ON o.id_cliente = c.id_cliente
      JOIN usuarios u ON o.id_usuario = u.id_usuario
      WHERE o.id_orden = ?
    `,
      [id],
    );

    if (ordenData.length === 0)
      return res.status(404).json({ error: "No encontrada" });

    let pagosData = [];
    try {
      const [pagos] = await db.query("SELECT * FROM pagos WHERE id_orden = ?", [
        id,
      ]);
      pagosData = pagos;
    } catch (e) {}

    res.json({ ...ordenData[0], historial_pagos: pagosData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 4. NUEVA ORDEN
app.post("/nueva-orden", async (req, res) => {
  const {
    id_usuario_actual,
    nombre,
    telefono,
    tipo_equipo,
    marca,
    modelo,
    imei_logico,
    imei_impreso,
    imei2,
    numero_serie,
    patron,
    falla,
    accesorios,
    anticipo,
  } = req.body;

  if (!id_usuario_actual)
    return res.status(400).json({ error: "Falta usuario" });

  try {
    let idCliente;
    const [existe] = await db.query(
      "SELECT id_cliente FROM clientes WHERE nombre = ?",
      [nombre],
    );
    if (existe.length > 0) {
      idCliente = existe[0].id_cliente;
      await db.query("UPDATE clientes SET telefono = ? WHERE id_cliente = ?", [
        telefono,
        idCliente,
      ]);
    } else {
      const [resCliente] = await db.query(
        "INSERT INTO clientes (nombre, telefono) VALUES (?, ?)",
        [nombre, telefono],
      );
      idCliente = resCliente.insertId;
    }

    const marcaModeloTexto = `${marca} ${modelo}`;

    const [resOrden] = await db.query(
      `INSERT INTO ordenes (
          id_cliente, id_usuario, tipo_equipo, marca, modelo,
          imei_logico, imei_impreso, imei2, numero_serie,
          patron, marca_modelo, falla_reportada, accesorios, estado
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recibido')`,
      [
        idCliente,
        id_usuario_actual,
        tipo_equipo || "celular",
        marca,
        modelo,
        imei_logico || "",
        imei_impreso || "",
        imei2 || "",
        numero_serie || "",
        patron || "",
        marcaModeloTexto,
        falla,
        accesorios || "",
      ],
    );
    const idOrden = resOrden.insertId;

    if (Number(anticipo) > 0) {
      await db.query(
        "INSERT INTO pagos (id_orden, id_usuario, monto, metodo_pago) VALUES (?, ?, ?, 'efectivo')",
        [idOrden, id_usuario_actual, anticipo],
      );
    }

    await registrarHistorial(
      id_usuario_actual,
      "CREAR_ORDEN",
      "ordenes",
      idOrden,
      {
        cliente: nombre,
        equipo: marcaModeloTexto,
      },
    );

    res.json({ mensaje: "Orden guardada", folio: idOrden });
  } catch (error) {
    console.error("Error al crear orden:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. CANCELAR
app.put("/ordenes/:id/cancelar", async (req, res) => {
  const { id } = req.params;
  const { motivo, id_usuario_actual } = req.body;
  try {
    await db.query(
      "UPDATE ordenes SET estado = 'cancelada', motivo_cancelacion = ? WHERE id_orden = ?",
      [motivo, id],
    );
    await registrarHistorial(id_usuario_actual, "CANCELACION", "ordenes", id, {
      motivo,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EDITAR DATOS DE ORDEN
app.put("/ordenes/:id/editar", async (req, res) => {
  const { id } = req.params;
  const { cliente, telefono, falla_reportada, accesorios, id_usuario } =
    req.body;
  try {
    await db.query(
      `UPDATE clientes c
       JOIN ordenes o ON o.id_cliente = c.id_cliente
       SET c.nombre = ?, c.telefono = ?
       WHERE o.id_orden = ?`,
      [cliente, telefono, id],
    );
    await db.query(
      `UPDATE ordenes SET falla_reportada = ?, accesorios = ? WHERE id_orden = ?`,
      [falla_reportada, accesorios, id],
    );
    await registrarHistorial(id_usuario, "EDITAR_ORDEN", "ordenes", id, {
      cliente,
      telefono,
      falla_reportada,
      accesorios,
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error editando orden:", error);
    res.status(500).json({ error: error.message });
  }
});

// CAMBIAR ESTADO
app.put("/ordenes/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado, id_usuario_actual, nota } = req.body;

  const estadosValidos = [
    "recibido",
    "pendiente",
    "en_revision",
    "en_reparacion",
    "reparado",
    "listo",
    "entregado",
    "cancelada",
  ];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ error: "Estado no válido" });

  try {
    // Obtener estado anterior
    const [ordenActual] = await db.query(
      "SELECT estado FROM ordenes WHERE id_orden = ?",
      [id],
    );
    const estadoAnterior = ordenActual[0]?.estado || null;

    // Actualizar estado
    await db.query("UPDATE ordenes SET estado = ? WHERE id_orden = ?", [
      estado,
      id,
    ]);

    // Guardar en log_estados
    await db.query(
      `INSERT INTO log_estados (id_orden, id_usuario, estado_anterior, estado_nuevo, nota)
       VALUES (?, ?, ?, ?, ?)`,
      [id, id_usuario_actual, estadoAnterior, estado, nota || null],
    );

    await registrarHistorial(
      id_usuario_actual,
      "CAMBIO_ESTADO",
      "ordenes",
      id,
      {
        estado_anterior: estadoAnterior,
        nuevo_estado: estado,
        nota,
      },
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. ACTUALIZAR DIAGNÓSTICO Y PRECIO
app.put("/ordenes/:id", async (req, res) => {
  const { id } = req.params;
  const { diagnostico_tecnico, total } = req.body;
  try {
    await db.query(
      "UPDATE ordenes SET diagnostico_tecnico = ?, total = ? WHERE id_orden = ?",
      [diagnostico_tecnico, total, id],
    );
    res.json({ message: "Orden actualizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. COBRAR Y ENTREGAR
app.post("/ordenes/:id/pagar", async (req, res) => {
  const { id } = req.params;
  const { id_usuario, monto, metodo, solo_abono } = req.body;
  if (!id_usuario)
    return res.status(400).json({ error: "Falta el ID del usuario." });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    if (monto && monto > 0) {
      await connection.query(
        "INSERT INTO pagos (id_orden, id_usuario, monto, metodo_pago) VALUES (?, ?, ?, ?)",
        [id, id_usuario, monto, metodo || "efectivo"],
      );
    }
    if (!solo_abono) {
      await connection.query(
        "UPDATE ordenes SET estado = 'entregado' WHERE id_orden = ?",
        [id],
      );
    }
    await connection.query(
      "INSERT INTO historial_movimientos (id_usuario, accion, tabla_afectada, id_registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)",
      [
        id_usuario,
        solo_abono ? "ABONO" : "ENTREGA_EQUIPO",
        "ordenes",
        id,
        JSON.stringify({ monto, metodo, solo_abono: !!solo_abono }),
      ],
    );
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// 8. BUSCADOR
app.get("/buscar-clientes", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const [clientes] = await db.query(
      "SELECT * FROM clientes WHERE nombre LIKE ? LIMIT 5",
      [`%${q}%`],
    );
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. SUBIR FOTO
app.post("/ordenes/:id/fotos", upload.single("foto"), async (req, res) => {
  const { id } = req.params;
  const { id_usuario, descripcion } = req.body;
  if (!req.file)
    return res.status(400).json({ error: "No se recibió ninguna foto" });
  if (!id_usuario) return res.status(400).json({ error: "Falta id_usuario" });
  try {
    await db.query(
      `INSERT INTO fotos_ordenes (id_orden, id_usuario, url, public_id, descripcion) VALUES (?, ?, ?, ?, ?)`,
      [id, id_usuario, req.file.path, req.file.filename, descripcion || ""],
    );
    await registrarHistorial(id_usuario, "SUBIR_FOTO", "fotos_ordenes", id, {
      url: req.file.path,
    });
    res.json({ success: true, url: req.file.path });
  } catch (error) {
    console.error("Error guardando foto:", error);
    res.status(500).json({ error: error.message });
  }
});

// 10. OBTENER FOTOS
app.get("/ordenes/:id/fotos", async (req, res) => {
  const { id } = req.params;
  try {
    const [fotos] = await db.query(
      `SELECT f.id_foto, f.url, f.descripcion, f.fecha_subida, u.nombre_completo as subida_por
       FROM fotos_ordenes f
       JOIN usuarios u ON f.id_usuario = u.id_usuario
       WHERE f.id_orden = ? ORDER BY f.fecha_subida DESC`,
      [id],
    );
    res.json(fotos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. ELIMINAR FOTO
app.delete("/fotos/:id_foto", async (req, res) => {
  const { id_foto } = req.params;
  const { id_usuario } = req.body;
  try {
    const [fotos] = await db.query(
      "SELECT public_id FROM fotos_ordenes WHERE id_foto = ?",
      [id_foto],
    );
    if (fotos.length === 0)
      return res.status(404).json({ error: "Foto no encontrada" });
    await cloudinary.uploader.destroy(fotos[0].public_id);
    await db.query("DELETE FROM fotos_ordenes WHERE id_foto = ?", [id_foto]);
    await registrarHistorial(
      id_usuario,
      "ELIMINAR_FOTO",
      "fotos_ordenes",
      id_foto,
      {},
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── EGRESOS ──
app.get("/egresos", async (req, res) => {
  const { desde, hasta } = req.query;
  try {
    let query = `
      SELECT e.id_egreso, e.concepto, e.monto, e.categoria, e.fecha,
             u.nombre_completo AS registrado_por, e.id_orden
      FROM egresos e JOIN usuarios u ON e.id_usuario = u.id_usuario
    `;
    const params = [];
    if (desde && hasta) {
      query += " WHERE DATE(e.fecha) BETWEEN ? AND ?";
      params.push(desde, hasta);
    }
    query += " ORDER BY e.fecha DESC LIMIT 50";
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/egresos", async (req, res) => {
  const { id_usuario, concepto, monto, categoria, id_orden } = req.body;
  if (!id_usuario || !concepto || !monto)
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  try {
    const [result] = await db.query(
      `INSERT INTO egresos (id_usuario, concepto, monto, categoria, id_orden) VALUES (?, ?, ?, ?, ?)`,
      [
        id_usuario,
        concepto,
        Number(monto),
        categoria || "otros",
        id_orden || null,
      ],
    );
    await registrarHistorial(
      id_usuario,
      "REGISTRAR_EGRESO",
      "egresos",
      result.insertId,
      { concepto, monto, categoria },
    );
    res.json({ success: true, id_egreso: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/egresos/:id", async (req, res) => {
  const { id } = req.params;
  const { id_usuario } = req.body;
  try {
    await db.query("DELETE FROM egresos WHERE id_egreso = ?", [id]);
    await registrarHistorial(id_usuario, "ELIMINAR_EGRESO", "egresos", id, {});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── REPORTES ──
app.get("/reportes/ingresos", async (req, res) => {
  try {
    const [hoy] = await db.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM pagos WHERE DATE(fecha_pago) = CURDATE()`,
    );
    const [semana] = await db.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM pagos WHERE fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
    );
    const [mes] = await db.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM pagos WHERE MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE())`,
    );
    const [porDia] = await db.query(
      `SELECT DATE(fecha_pago) as fecha, SUM(monto) as total, COUNT(*) as num_pagos FROM pagos WHERE fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(fecha_pago) ORDER BY fecha ASC`,
    );
    const [ultimos] = await db.query(
      `SELECT p.monto, p.metodo_pago, p.fecha_pago, c.nombre as cliente, o.id_orden, o.marca_modelo FROM pagos p JOIN ordenes o ON p.id_orden = o.id_orden JOIN clientes c ON o.id_cliente = c.id_cliente ORDER BY p.fecha_pago DESC LIMIT 20`,
    );
    const [egresoHoy] = await db.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE DATE(fecha) = CURDATE()`,
    );
    const [egresoSemana] = await db.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
    );
    const [egresoMes] = await db.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())`,
    );
    const [egresosPorDia] = await db.query(
      `SELECT DATE(fecha) as fecha, SUM(monto) as total_egreso FROM egresos WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(fecha) ORDER BY fecha ASC`,
    );
    const [ultimosEgresos] = await db.query(
      `SELECT e.id_egreso, e.concepto, e.monto, e.categoria, e.fecha, u.nombre_completo AS registrado_por FROM egresos e JOIN usuarios u ON e.id_usuario = u.id_usuario ORDER BY e.fecha DESC LIMIT 10`,
    );
    res.json({
      hoy: hoy[0].total,
      semana: semana[0].total,
      mes: mes[0].total,
      porDia,
      ultimos,
      egresoHoy: egresoHoy[0].total,
      egresoSemana: egresoSemana[0].total,
      egresoMes: egresoMes[0].total,
      egresosPorDia,
      ultimosEgresos,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── CATÁLOGOS MARCAS ──
app.get("/catalogos/marcas", async (req, res) => {
  try {
    const [r] = await db.query(
      "SELECT * FROM catalogos_marcas WHERE activo = 1 ORDER BY nombre ASC",
    );
    res.json(r);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/catalogos/marcas", async (req, res) => {
  const { nombre, id_usuario } = req.body;
  if (!nombre) return res.status(400).json({ error: "Falta el nombre" });
  try {
    const [result] = await db.query(
      "INSERT INTO catalogos_marcas (nombre) VALUES (?)",
      [nombre.trim()],
    );
    await registrarHistorial(
      id_usuario,
      "CREAR_MARCA",
      "catalogos_marcas",
      result.insertId,
      { nombre },
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Esa marca ya existe" });
    res.status(500).json({ error: error.message });
  }
});
app.delete("/catalogos/marcas/:id", async (req, res) => {
  const { id } = req.params;
  const { id_usuario } = req.body;
  try {
    await db.query("UPDATE catalogos_marcas SET activo = 0 WHERE id = ?", [id]);
    await registrarHistorial(
      id_usuario,
      "ELIMINAR_MARCA",
      "catalogos_marcas",
      id,
      {},
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── CATÁLOGOS MODELOS ──
app.get("/catalogos/marcas/:id/modelos", async (req, res) => {
  const { id } = req.params;
  try {
    const [r] = await db.query(
      "SELECT * FROM catalogos_modelos WHERE id_marca = ? AND activo = 1 ORDER BY nombre ASC",
      [id],
    );
    res.json(r);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/catalogos/marcas/:id/modelos", async (req, res) => {
  const { id } = req.params;
  const { nombre, id_usuario } = req.body;
  if (!nombre) return res.status(400).json({ error: "Falta el nombre" });
  try {
    const [result] = await db.query(
      "INSERT INTO catalogos_modelos (id_marca, nombre) VALUES (?, ?)",
      [id, nombre.trim()],
    );
    await registrarHistorial(
      id_usuario,
      "CREAR_MODELO",
      "catalogos_modelos",
      result.insertId,
      { nombre, id_marca: id },
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/catalogos/modelos/:id", async (req, res) => {
  const { id } = req.params;
  const { id_usuario } = req.body;
  try {
    await db.query("UPDATE catalogos_modelos SET activo = 0 WHERE id = ?", [
      id,
    ]);
    await registrarHistorial(
      id_usuario,
      "ELIMINAR_MODELO",
      "catalogos_modelos",
      id,
      {},
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── CATÁLOGOS COMPAÑÍAS ──
app.get("/catalogos/companias", async (req, res) => {
  try {
    const [r] = await db.query(
      "SELECT * FROM catalogos_companias WHERE activo = 1 ORDER BY nombre ASC",
    );
    res.json(r);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/catalogos/companias", async (req, res) => {
  const { nombre, id_usuario } = req.body;
  if (!nombre) return res.status(400).json({ error: "Falta el nombre" });
  try {
    const [result] = await db.query(
      "INSERT INTO catalogos_companias (nombre) VALUES (?)",
      [nombre.trim()],
    );
    await registrarHistorial(
      id_usuario,
      "CREAR_COMPANIA",
      "catalogos_companias",
      result.insertId,
      { nombre },
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Esa compañía ya existe" });
    res.status(500).json({ error: error.message });
  }
});
app.delete("/catalogos/companias/:id", async (req, res) => {
  const { id } = req.params;
  const { id_usuario } = req.body;
  try {
    await db.query("UPDATE catalogos_companias SET activo = 0 WHERE id = ?", [
      id,
    ]);
    await registrarHistorial(
      id_usuario,
      "ELIMINAR_COMPANIA",
      "catalogos_companias",
      id,
      {},
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── USUARIOS ──
app.get("/usuarios", async (req, res) => {
  try {
    const [r] = await db.query(
      "SELECT id_usuario, username, nombre_completo, rol, activo FROM usuarios ORDER BY nombre_completo ASC",
    );
    res.json(r);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/usuarios", async (req, res) => {
  const { username, password, nombre_completo, rol, id_usuario_actual } =
    req.body;
  if (!username || !password || !nombre_completo || !rol)
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO usuarios (username, password, nombre_completo, rol) VALUES (?, ?, ?, ?)",
      [username, hash, nombre_completo, rol],
    );
    await registrarHistorial(
      id_usuario_actual,
      "CREAR_USUARIO",
      "usuarios",
      result.insertId,
      { username, rol },
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Ese username ya existe" });
    res.status(500).json({ error: error.message });
  }
});
app.put("/usuarios/:id/activo", async (req, res) => {
  const { id } = req.params;
  const { activo, id_usuario_actual } = req.body;
  try {
    await db.query("UPDATE usuarios SET activo = ? WHERE id_usuario = ?", [
      activo,
      id,
    ]);
    await registrarHistorial(
      id_usuario_actual,
      activo ? "ACTIVAR_USUARIO" : "DESACTIVAR_USUARIO",
      "usuarios",
      id,
      {},
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── CLIENTES ──
app.get("/clientes", async (req, res) => {
  const { q } = req.query;
  try {
    let query = "SELECT * FROM clientes";
    const params = [];
    if (q) {
      query += " WHERE nombre LIKE ? OR telefono LIKE ?";
      params.push(`%${q}%`, `%${q}%`);
    }
    query += " ORDER BY nombre ASC LIMIT 50";
    const [r] = await db.query(query, params);
    res.json(r);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/clientes/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, id_usuario } = req.body;
  try {
    await db.query(
      "UPDATE clientes SET nombre = ?, telefono = ? WHERE id_cliente = ?",
      [nombre, telefono, id],
    );
    await registrarHistorial(id_usuario, "EDITAR_CLIENTE", "clientes", id, {
      nombre,
      telefono,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── CAMBIAR CONTRASEÑA ──
app.put("/usuarios/:id/password", async (req, res) => {
  const { id } = req.params;
  const { password_actual, password_nueva, id_usuario_actual } = req.body;
  if (parseInt(id) !== parseInt(id_usuario_actual))
    return res
      .status(403)
      .json({ error: "Solo puedes cambiar tu propia contraseña" });
  if (!password_nueva || password_nueva.length < 6)
    return res
      .status(400)
      .json({ error: "La contraseña nueva debe tener al menos 6 caracteres" });
  try {
    const [users] = await db.query(
      "SELECT password FROM usuarios WHERE id_usuario = ?",
      [id],
    );
    if (users.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });
    const passwordValida = await bcrypt.compare(
      password_actual,
      users[0].password,
    );
    if (!passwordValida)
      return res
        .status(401)
        .json({ error: "La contraseña actual es incorrecta" });
    const hash = await bcrypt.hash(password_nueva, 10);
    await db.query("UPDATE usuarios SET password = ? WHERE id_usuario = ?", [
      hash,
      id,
    ]);
    await registrarHistorial(
      id_usuario_actual,
      "CAMBIO_PASSWORD",
      "usuarios",
      id,
      {},
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── REFACCIONES ──
app.get("/ordenes/:id/refacciones", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT r.id_refaccion, r.descripcion, r.costo_compra, r.precio_cobrado, r.fecha,
              u.nombre_completo as registrado_por
       FROM refacciones_orden r
       JOIN usuarios u ON r.id_usuario = u.id_usuario
       WHERE r.id_orden = ? ORDER BY r.fecha ASC`,
      [id],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/ordenes/:id/refacciones", async (req, res) => {
  const { id } = req.params;
  const { id_usuario, descripcion, costo_compra, precio_cobrado } = req.body;

  if (
    !descripcion ||
    costo_compra === undefined ||
    precio_cobrado === undefined
  )
    return res.status(400).json({ error: "Faltan campos obligatorios" });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insertar la refacción
    const [result] = await connection.query(
      `INSERT INTO refacciones_orden (id_orden, id_usuario, descripcion, costo_compra, precio_cobrado)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        id_usuario,
        descripcion.toUpperCase(),
        Number(costo_compra),
        Number(precio_cobrado),
      ],
    );

    // 2. Egreso automático por el costo de compra
    if (Number(costo_compra) > 0) {
      await connection.query(
        `INSERT INTO egresos (id_usuario, concepto, monto, categoria, id_orden)
         VALUES (?, ?, ?, 'refacciones', ?)`,
        [
          id_usuario,
          `REFACCIÓN: ${descripcion.toUpperCase()} (ORDEN #${id})`,
          Number(costo_compra),
          id,
        ],
      );
    }

    await connection.query(
      `INSERT INTO historial_movimientos (id_usuario, accion, tabla_afectada, id_registro_afectado, detalles)
       VALUES (?, 'AGREGAR_REFACCION', 'refacciones_orden', ?, ?)`,
      [
        id_usuario,
        result.insertId,
        JSON.stringify({
          id_orden: id,
          descripcion,
          costo_compra,
          precio_cobrado,
        }),
      ],
    );

    await connection.commit();
    res.json({ success: true, id_refaccion: result.insertId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.delete("/refacciones/:id_refaccion", async (req, res) => {
  const { id_refaccion } = req.params;
  const { id_usuario } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [refData] = await connection.query(
      "SELECT * FROM refacciones_orden WHERE id_refaccion = ?",
      [id_refaccion],
    );
    if (refData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Refacción no encontrada" });
    }

    const ref = refData[0];

    // Eliminar egreso automático asociado
    await connection.query(
      `DELETE FROM egresos WHERE id_orden = ? AND categoria = 'refacciones'
       AND concepto LIKE ? AND monto = ?`,
      [ref.id_orden, `REFACCIÓN: ${ref.descripcion}%`, ref.costo_compra],
    );

    await connection.query(
      "DELETE FROM refacciones_orden WHERE id_refaccion = ?",
      [id_refaccion],
    );

    await connection.query(
      `INSERT INTO historial_movimientos (id_usuario, accion, tabla_afectada, id_registro_afectado, detalles)
       VALUES (?, 'ELIMINAR_REFACCION', 'refacciones_orden', ?, '{}')`,
      [id_usuario, id_refaccion],
    );

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// ── CAJA DIARIA ──
app.get("/caja/estado", async (req, res) => {
  try {
    const [apertura] = await db.query(
      `SELECT cc.*, u.nombre_completo as usuario FROM cortes_caja cc
       JOIN usuarios u ON cc.id_usuario = u.id_usuario
       WHERE cc.tipo = 'apertura' AND DATE(cc.fecha) = CURDATE()
       ORDER BY cc.fecha DESC LIMIT 1`,
    );
    if (apertura.length === 0) return res.json({ abierta: false, corte: null });
    const [cierre] = await db.query(
      `SELECT id_corte FROM cortes_caja WHERE tipo = 'cierre' AND DATE(fecha) = CURDATE() LIMIT 1`,
    );
    res.json({ abierta: cierre.length === 0, corte: apertura[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/caja/apertura", async (req, res) => {
  const { id_usuario, monto_inicial, notas } = req.body;
  if (!id_usuario || monto_inicial === undefined)
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  try {
    const [yaAbierta] = await db.query(
      `SELECT id_corte FROM cortes_caja WHERE tipo = 'apertura' AND DATE(fecha) = CURDATE() LIMIT 1`,
    );
    if (yaAbierta.length > 0)
      return res.status(409).json({ error: "Ya hay una caja abierta hoy" });
    const [result] = await db.query(
      `INSERT INTO cortes_caja (id_usuario, tipo, monto_inicial, notas) VALUES (?, 'apertura', ?, ?)`,
      [id_usuario, Number(monto_inicial), notas || null],
    );
    await registrarHistorial(
      id_usuario,
      "APERTURA_CAJA",
      "cortes_caja",
      result.insertId,
      { monto_inicial },
    );
    res.json({ success: true, id_corte: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/caja/cierre", async (req, res) => {
  const { id_usuario, monto_final, notas } = req.body;
  if (!id_usuario || monto_final === undefined)
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  try {
    const [ingresos] = await db.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM pagos WHERE DATE(fecha_pago) = CURDATE()`,
    );
    const [egresos] = await db.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE DATE(fecha) = CURDATE()`,
    );
    const [apertura] = await db.query(
      `SELECT monto_inicial FROM cortes_caja WHERE tipo = 'apertura' AND DATE(fecha) = CURDATE() ORDER BY fecha DESC LIMIT 1`,
    );
    if (apertura.length === 0)
      return res
        .status(400)
        .json({ error: "No hay apertura de caja registrada hoy" });
    const totalIngresos = Number(ingresos[0].total);
    const totalEgresos = Number(egresos[0].total);
    const montoInicial = Number(apertura[0].monto_inicial);
    const montoFinal = Number(monto_final);
    const diferencia =
      montoFinal - (montoInicial + totalIngresos - totalEgresos);
    const [result] = await db.query(
      `INSERT INTO cortes_caja (id_usuario, tipo, monto_final, total_ingresos, total_egresos, diferencia, notas) VALUES (?, 'cierre', ?, ?, ?, ?, ?)`,
      [
        id_usuario,
        montoFinal,
        totalIngresos,
        totalEgresos,
        diferencia,
        notas || null,
      ],
    );
    await registrarHistorial(
      id_usuario,
      "CIERRE_CAJA",
      "cortes_caja",
      result.insertId,
      {
        monto_final,
        total_ingresos: totalIngresos,
        total_egresos: totalEgresos,
        diferencia,
      },
    );
    res.json({
      success: true,
      resumen: {
        monto_inicial: montoInicial,
        total_ingresos: totalIngresos,
        total_egresos: totalEgresos,
        monto_esperado: montoInicial + totalIngresos - totalEgresos,
        monto_final: montoFinal,
        diferencia,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/caja/historial", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT cc.*, u.nombre_completo as usuario FROM cortes_caja cc
       JOIN usuarios u ON cc.id_usuario = u.id_usuario
       ORDER BY cc.fecha DESC LIMIT 60`,
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── BUSCAR CLIENTES (buscador de nueva orden) ──
app.get("/buscar-clientes", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const [r] = await db.query(
      "SELECT * FROM clientes WHERE nombre LIKE ? LIMIT 5",
      [`%${q}%`],
    );
    res.json(r);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

app.get("/ordenes/:id/log-estados", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT l.id_log, l.estado_anterior, l.estado_nuevo, l.nota, l.fecha,
              u.nombre_completo as usuario
       FROM log_estados l
       JOIN usuarios u ON l.id_usuario = u.id_usuario
       WHERE l.id_orden = ?
       ORDER BY l.fecha ASC`,
      [id],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cualquier ruta que no sea API devuelve el index.html
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});
