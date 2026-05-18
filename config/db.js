const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financas_db',
  port: process.env.DB_PORT || 5432,
});

async function testConnection() {
  const client = await pool.connect();
  client.release();
}

async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  testConnection,
  closePool,
};
