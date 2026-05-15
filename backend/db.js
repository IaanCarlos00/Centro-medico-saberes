const { Pool } = require('pg');

const isLocal = !process.env.RAILWAY_ENVIRONMENT;

if (isLocal) {
  require('dotenv').config();
}

const pool = isLocal
  ? new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: false,
    })
  : new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

module.exports = pool;