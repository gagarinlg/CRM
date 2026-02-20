'use strict';

require('dotenv').config();

const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'crm_db',
    user: process.env.DB_USER || 'crm_user',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
