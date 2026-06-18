const mysql = require("mysql2/promise");

let pool = null;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.MYSQL_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log("✅ Conexión a MySQL establecida");
  }
  return pool;
}

module.exports = { getPool };
