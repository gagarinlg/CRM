'use strict';

require('dotenv').config();

const knex = require('knex');

// pg's val() treats an empty string as "not provided" and falls back to
// PGPASSWORD / defaults.password = null.  typeof null !== 'string', which
// causes SASL SCRAM authentication to throw "client password must be a string".
// Fail fast with a clear message rather than a cryptic SASL error.
const _dbPassword = process.env.DB_PASSWORD;
if (!_dbPassword) {
  throw new Error(
    'DB_PASSWORD environment variable is required but not set.\n' +
      'Check /opt/crm/.env (or your .env file) and ensure DB_PASSWORD is a non-empty string.'
  );
}

// SSL is opt-in: set DB_SSL=true in .env when connecting to a remote/cloud
// PostgreSQL that requires TLS.  Local installs typically do not need SSL.
const _sslConfig = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'crm_db',
    user: process.env.DB_USER || 'crm_user',
    password: _dbPassword,
    ssl: _sslConfig,
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000,
  },
  acquireConnectionTimeout: 30000,
});

/**
 * Verify database connectivity.
 * @returns {Promise<void>}
 */
async function connectDB() {
  await db.raw('SELECT 1');
}

/**
 * Destroy the connection pool.
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  await db.destroy();
}

module.exports = { db, connectDB, disconnectDB };
