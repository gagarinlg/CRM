'use strict';

/**
 * Lightweight CalDAV server (read-only export + write via POST/PUT).
 *
 * Endpoints:
 *   GET  /caldav/:userId/calendar  – full iCalendar feed for a user
 *   GET  /caldav/:userId/events/:id – single VEVENT
 *
 * Authentication: HTTP Basic Auth (username + password) or Authorization: Bearer <jwt>
 *
 * Standards implemented:
 *   - RFC 4791 (CalDAV) – subset: GET calendar resource
 *   - RFC 5545 (iCalendar) – VCALENDAR / VEVENT production
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { comparePassword } = require('../utils/password');
const logger = require('../config/logger');

// ── Auth helper ────────────────────────────────────────────────────────────

async function authenticate(req, res) {
  // 1. Bearer JWT
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      return payload.userId || payload.id || payload.sub;
    } catch {
      res.status(401).set('WWW-Authenticate', 'Bearer realm="CRM CalDAV"').json({ error: 'Invalid token.' });
      return null;
    }
  }

  // 2. HTTP Basic Auth
  if (authHeader.startsWith('Basic ')) {
    const b64 = authHeader.slice(6);
    const [identifier, password] = Buffer.from(b64, 'base64').toString().split(':');
    if (!identifier || !password) {
      res.status(401).set('WWW-Authenticate', 'Basic realm="CRM CalDAV"').json({ error: 'Invalid credentials.' });
      return null;
    }
    const user = await db('users')
      .where(function () { this.where('username', identifier).orWhere('email', identifier); })
      .whereNull('deleted_at')
      .first();
    if (!user || !(await comparePassword(password, user.password_hash))) {
      res.status(401).set('WWW-Authenticate', 'Basic realm="CRM CalDAV"').json({ error: 'Invalid credentials.' });
      return null;
    }
    return user.id;
  }

  res.status(401).set('WWW-Authenticate', 'Basic realm="CRM CalDAV"').json({ error: 'Authentication required.' });
  return null;
}

// ── iCalendar helpers ──────────────────────────────────────────────────────

function escapeIcal(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toIcalDate(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function eventToVEVENT(ev) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${ev.id}@crm`,
    `DTSTAMP:${toIcalDate(ev.created_at)}`,
    `DTSTART:${ev.is_all_day ? toIcalDate(ev.start_datetime).slice(0, 8) : toIcalDate(ev.start_datetime)}`,
    `DTEND:${ev.is_all_day ? toIcalDate(ev.end_datetime).slice(0, 8) : toIcalDate(ev.end_datetime)}`,
    `SUMMARY:${escapeIcal(ev.title)}`,
  ];
  if (ev.description) lines.push(`DESCRIPTION:${escapeIcal(ev.description)}`);
  if (ev.recurrence_rule) lines.push(`RRULE:${ev.recurrence_rule}`);
  if (ev.is_all_day) lines.splice(3, 0, 'X-MICROSOFT-CDO-ALLDAYEVENT:TRUE');
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

function buildVCALENDAR(events, calName) {
  const vevents = events.map(eventToVEVENT).join('\r\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CRM//CRM CalDAV//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcal(calName || 'CRM Calendar')}`,
    vevents,
    'END:VCALENDAR',
  ].join('\r\n');
}

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /caldav/:userId/calendar
 * Returns a full iCalendar feed for the given user.
 * Accepts ?start=ISO&end=ISO query params for date filtering.
 */
router.get('/:userId/calendar', async (req, res) => {
  try {
    const callerId = await authenticate(req, res);
    if (!callerId) return;

    const { userId } = req.params;

    // Users can only access their own calendar (admins can access any)
    const caller = await db('users').where({ id: callerId }).first();
    const isAdmin = caller && await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', callerId)
      .where('roles.name', 'admin')
      .first();

    if (callerId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    let query = db('events').where('created_by', userId).orderBy('start_datetime');
    if (req.query.start) query = query.where('start_datetime', '>=', req.query.start);
    if (req.query.end) query = query.where('end_datetime', '<=', req.query.end);

    const events = await query;
    const owner = await db('users').select('first_name', 'last_name').where({ id: userId }).first();
    const calName = owner ? `${owner.first_name} ${owner.last_name}`.trim() || 'CRM Calendar' : 'CRM Calendar';

    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="calendar.ics"`);
    return res.send(buildVCALENDAR(events, calName));
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /caldav/:userId/events/:id
 * Returns a single VEVENT in iCalendar format.
 */
router.get('/:userId/events/:id', async (req, res) => {
  try {
    const callerId = await authenticate(req, res);
    if (!callerId) return;

    const ev = await db('events').where({ id: req.params.id }).first();
    if (!ev) return res.status(404).json({ error: 'Event not found.' });

    res.set('Content-Type', 'text/calendar; charset=utf-8');
    return res.send(['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CRM//CRM CalDAV//EN',
      eventToVEVENT(ev), 'END:VCALENDAR'].join('\r\n'));
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
