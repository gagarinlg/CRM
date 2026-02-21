'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security & performance middleware ────────────────────────────────────────
// Disable HSTS when not actually serving HTTPS: sending Strict-Transport-Security
// over a plain-HTTP connection causes browsers to cache "use HTTPS for this host"
// and then auto-upgrade all sub-resource requests (assets, API) to https://, which
// fails with a null-status "CORS" error because the server only speaks HTTP.
app.use(helmet({
  strictTransportSecurity: process.env.SSL_CERT_PATH ? {
    maxAge: 31536000,
    includeSubDomains: true,
  } : false,
}));
app.use(compression());

// Build the set of allowed CORS origins.
// Requests that carry no Origin header (same-origin browser requests, curl, etc.)
// are always passed through. Configured origins:
//   1. CORS_ORIGINS env var – comma-separated list for multi-domain setups
//   2. FRONTEND_URL – the canonical front-end URL (may differ from the API host)
//   3. http/https localhost variants – always allowed for dev/health-checks
const _corsPort = parseInt(process.env.PORT || '3000', 10);
const _corsAllowed = new Set(
  [
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
    process.env.FRONTEND_URL,
    `http://localhost:${_corsPort}`,
    `https://localhost:${_corsPort}`,
    'http://localhost:5173',
  ].filter(Boolean).map(o => o.trim()),
);

app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin requests (browser doesn't send Origin) and listed origins
    if (!origin || _corsAllowed.has(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting is disabled in CI / test environments to avoid 429 errors
// during automated test runs.  In production both limiters are active.
const isTestEnv = process.env.CI === 'true' || process.env.NODE_ENV === 'test';

const globalLimiter = isTestEnv
  ? (_req, _res, next) => next()   // no-op in CI/test
  : rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many requests, please try again later.' },
  });

// Apply global limiter to API routes only – static assets must not be rate-limited
// because each page load fetches many JS/CSS chunks, which would quickly exhaust
// the per-IP counter and cause 429 responses on legitimate browser navigation.
app.use('/api/v1', globalLimiter);
app.use('/caldav', globalLimiter);
app.use('/carddav', globalLimiter);

// Strict rate-limiter for authentication *attempt* endpoints only (login, 2FA,
// token refresh). Read-only endpoints like GET /auth/me are not covered here.
const authLimiter = isTestEnv
  ? (_req, _res, next) => next()   // no-op in CI/test
  : rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many authentication attempts, please try again later.' },
  });

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request logging ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    uptime: process.uptime(),
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
// Apply authLimiter only to the endpoints that are targets for brute-force
// attacks (login, token refresh, 2FA completion).  GET /auth/me and
// POST /auth/logout are read/session operations covered by globalLimiter.
const AUTH = '/api/v1/auth';
app.use(`${AUTH}/login`, authLimiter);
app.use(`${AUTH}/refresh`, authLimiter);
app.use(`${AUTH}/2fa/verify`, authLimiter);
app.use(AUTH, require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/roles', require('./routes/roles'));
app.use('/api/v1/groups', require('./routes/groups'));
app.use('/api/v1/companies', require('./routes/companies'));
app.use('/api/v1/contacts', require('./routes/contacts'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/leads', require('./routes/leads'));
app.use('/api/v1/notes', require('./routes/notes'));
app.use('/api/v1/calendar', require('./routes/calendar'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/reports', require('./routes/reports'));
app.use('/api/v1/settings', require('./routes/settings'));
app.use('/api/v1/email', require('./routes/email'));
app.use('/api/v1/i18n', require('./routes/i18n'));
app.use('/api/v1/attachments/:entityType/:entityId', require('./routes/attachments'));
app.use('/api/v1/search', require('./routes/search'));
app.use('/api/v1/tags', require('./routes/tags'));

// ── CalDAV / CardDAV sync endpoints ───────────────────────────────────────
app.use('/caldav', require('./caldav/index'));
app.use('/carddav', require('./carddav/index'));

// ── Serve built React frontend (production / Docker) ─────────────────────────
// The Dockerfile copies the Vite build output to src/client/dist.
// In development the Vite dev-server runs separately; skip static serving when
// the dist directory does not exist so the server still starts cleanly.
const path = require('path');
const fs = require('fs');
const clientDist = path.join(__dirname, '../../src/client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback – serve index.html for any non-API route
  app.get(/^(?!\/api\/).*$/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ── 404 handler (API routes only when frontend is not built) ─────────────────
app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found.' });
});

// ── Centralized error handler ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
