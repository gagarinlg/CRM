'use strict';

require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/database');
const logger = require('./config/logger');
const knex = require('knex');
const knexConfig = require('./config/knexfile');

const PORT = parseInt(process.env.PORT || '3000', 10);

async function runMigrations() {
  const db = knex(knexConfig[process.env.NODE_ENV || 'development']);
  try {
    logger.info('Running pending migrations...');
    const [batchNo, migrations] = await db.migrate.latest();
    if (migrations.length === 0) {
      logger.info('No pending migrations.');
    } else {
      logger.info(`Batch ${batchNo} ran ${migrations.length} migration(s): ${migrations.join(', ')}`);
    }
  } finally {
    await db.destroy();
  }
}

async function start() {
  try {
    // 1. Verify database connectivity
    logger.info('Connecting to database...');
    await connectDB();
    logger.info('Database connected.');

    // 2. Run pending migrations
    await runMigrations();

    // 3. Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`CRM server listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        const { disconnectDB } = require('./config/database');
        await disconnectDB().catch(() => {});
        logger.info('Server closed.');
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection:', { reason });
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception:', { message: err.message, stack: err.stack });
      process.exit(1);
    });

    return server;
  } catch (err) {
    logger.error('Failed to start server:', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
