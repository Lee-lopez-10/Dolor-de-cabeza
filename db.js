const sql = require('mssql');

const config = {
  server: 'DESKTOP-BOI3R9R\\MSSQLSERVER01',
  port: 1433,
  user: 'admin_rosales',
  password: 'Admin1234!',
  database: 'ComercializadoraRosales',
  options: {
    trustServerCertificate: true,
    encrypt: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('✅ Conexión a SQL Server establecida correctamente');
  }
  return pool;
}

module.exports = { getPool, sql };
