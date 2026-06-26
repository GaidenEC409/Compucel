// server/db.js
const mysql = require("mysql2/promise"); // <--- OJO AQUÍ: Agregamos '/promise'

require("dotenv").config();

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PORT:", process.env.DB_PORT);

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

// Probamos la conexión
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error conectando a la BD:", err.message);
  } else {
    console.log("✅ Conectado exitosamente a la Base de Datos");
    connection.release();
  }
});

module.exports = db;
