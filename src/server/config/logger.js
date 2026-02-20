'use strict';

const path = require('path');
const winston = require('winston');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const logLevel = process.env.LOG_LEVEL || 'info';
const isDev = process.env.NODE_ENV !== 'production';

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}]: ${stack || message}${metaStr}`;
  })
);

const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const transports = [
  new winston.transports.Console({
    format: isDev ? consoleFormat : fileFormat,
    handleExceptions: true,
  }),
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: fileFormat,
    handleExceptions: true,
    maxsize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 5,
  }),
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format: fileFormat,
    maxsize: 20 * 1024 * 1024, // 20 MB
    maxFiles: 10,
  }),
];

const logger = winston.createLogger({
  level: logLevel,
  transports,
  exitOnError: false,
});

module.exports = logger;
