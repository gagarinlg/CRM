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

module.exports = {
  development: {
    ...base,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'crm_db',
      user: process.env.DB_USER || 'crm_user',
      password: process.env.DB_PASSWORD || '',
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
      password: process.env.DB_PASSWORD || '',
    },
    pool: { min: 1, max: 5 },
  },

  production: {
    ...base,
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: { min: 2, max: 10 },
  },
};
