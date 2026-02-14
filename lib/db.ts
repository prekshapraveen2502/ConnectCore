import sql from 'mssql';

const sqlConfig: sql.config = {
  user: 'sa',
  password: 'StrongPassword123!',
  database: 'TelecomDB',
  server: 'localhost',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // Use this if you're on Azure.
    trustServerCertificate: true // Change to true for local dev / self-signed certs
  }
}

// Singleton connection helper
export async function getConnection() {
  try {
    return await sql.connect(sqlConfig);
  } catch (err) {
    console.error('SQL Connection Error', err);
    throw err;
  }
}

export { sql };
