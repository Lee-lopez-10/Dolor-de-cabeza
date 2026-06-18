const sql = require("mssql");

// Configuración 1: Con el usuario admin_rosales
const config1 = {
  user: "admin_rosales",
  password: "Admin1234!",
  server: "DESKTOP-BOI3R9R\\MSSQLSERVER01",
  port: 1433,
  database: "ComercializadoraRosales",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: "MSSQLSERVER01",
  },
};

// Configuración 2: Con autenticación de Windows (alternativa)
const config2 = {
  server: "DESKTOP-BOI3R9R\\MSSQLSERVER01",
  database: "ComercializadoraRosales",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    trustedConnection: true,
  },
};

async function testConnection() {
  console.log("🔍 Probando conexión con usuario SQL...");
  console.log("   Usuario:", config1.user);
  console.log("   Servidor:", config1.server);
  console.log("   Base de datos:", config1.database);
  console.log("");

  try {
    const pool = await sql.connect(config1);
    console.log("✅ Conexión EXITOSA con usuario SQL");
    const result = await pool.request().query("SELECT DB_NAME() AS DatabaseName, USER_NAME() AS CurrentUser");
    console.log("📊 Base de datos actual:", result.recordset[0].DatabaseName);
    console.log("👤 Usuario actual:", result.recordset[0].CurrentUser);
    await pool.close();
  } catch (err) {
    console.error("❌ Error con usuario SQL:", err.message);
    console.log("");
    console.log("🔄 Intentando con autenticación de Windows...");
    
    try {
      const pool = await sql.connect(config2);
      console.log("✅ Conexión EXITOSA con autenticación de Windows");
      const result = await pool.request().query("SELECT DB_NAME() AS DatabaseName, SYSTEM_USER AS CurrentUser");
      console.log("📊 Base de datos actual:", result.recordset[0].DatabaseName);
      console.log("👤 Usuario actual:", result.recordset[0].CurrentUser);
      await pool.close();
      
      console.log("");
      console.log("💡 SOLUCIÓN: Usa autenticación de Windows en lugar de usuario SQL");
    } catch (err2) {
      console.error("❌ Error con Windows Auth:", err2.message);
    }
  }

  process.exit();
}

testConnection();
