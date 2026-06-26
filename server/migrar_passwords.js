const mysql = require("mysql2/promise");
require("dotenv").config();
const bcrypt = require("bcrypt");

async function migrar() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3316,
  });

  console.log("✅ Conectado a la BD");

  const [usuarios] = await db.query(
    "SELECT id_usuario, username, password FROM usuarios",
  );
  console.log(`Encontrados ${usuarios.length} usuarios`);

  for (const u of usuarios) {
    console.log(`Procesando: ${u.username} → ${u.password}`);
    if (!u.password.startsWith("$2b$")) {
      const hash = await bcrypt.hash(u.password, 10);
      await db.query("UPDATE usuarios SET password = ? WHERE id_usuario = ?", [
        hash,
        u.id_usuario,
      ]);
      console.log(`✅ ${u.username} migrado`);
    } else {
      console.log(`⏭️ ${u.username} ya estaba encriptado`);
    }
  }

  console.log("✅ Migración completa");
  await db.end();
}

migrar().catch(console.error);
