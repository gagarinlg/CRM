'use strict';

require('dotenv').config();

const path = require('path');

/** @type {import('knex').Knex.Config} */
const base = {
  client: 'pg',
  migrations: {
    directory: path.resolve(__dirname, '../migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.resolve(__dirname, '../seeds'),
  },
};

// pg treats '' the same as undefined and falls back to defaults.password = null.
// Use the raw env var without a falsy-string fallback so a missing password
// causes an obvious error rather than a silent SASL authentication failure.
const _pgPassword = () => process.env.DB_PASSWORD;

module.exports = {
  development: {
    ...base,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'crm_db',
      user: process.env.DB_USER || 'crm_user',
      password: _pgPassword(),
    },
    pool: { min: 2, max: 10 },
  },

  test: {
    ...base,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'crm_test',
      user: process.env.DB_USER || 'crm_user',
      password: _pgPassword(),
    },
    pool: { min: 1, max: 5 },
  },

  production: {
    ...base,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'crm_db',
      user: process.env.DB_USER || 'crm_user',
      password: _pgPassword(),
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: { min: 2, max: 10 },
  },
};
