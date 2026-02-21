'use strict';

/**
 * Lightweight CardDAV server (read-only vCard export).
 *
 * Endpoints:
 *   GET /carddav/:userId/contacts        – full vCard addressbook for a user
 *   GET /carddav/:userId/contacts/:id    – single vCard
 *
 * Authentication: HTTP Basic Auth (username + password) or Authorization: Bearer <jwt>
 *
 * Standards implemented:
 *   - RFC 6352 (CardDAV) – subset: GET addressbook resource
 *   - RFC 6350 (vCard 4.0) – VCARD production
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { comparePassword } = require('../utils/password');
const logger = require('../config/logger');

// ── Auth helper (same as CalDAV) ───────────────────────────────────────────

async function authenticate(req, res) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      return payload.userId || payload.id || payload.sub;
    } catch {
      res.status(401).set('WWW-Authenticate', 'Bearer realm="CRM CardDAV"').json({ error: 'Invalid token.' });
      return null;
    }
  }
  if (authHeader.startsWith('Basic ')) {
    const b64 = authHeader.slice(6);
    const [identifier, password] = Buffer.from(b64, 'base64').toString().split(':');
    if (!identifier || !password) {
      res.status(401).set('WWW-Authenticate', 'Basic realm="CRM CardDAV"').json({ error: 'Invalid credentials.' });
      return null;
    }
    const user = await db('users')
      .where(function () { this.where('username', identifier).orWhere('email', identifier); })
      .whereNull('deleted_at')
      .first();
    if (!user || !(await comparePassword(password, user.password_hash))) {
      res.status(401).set('WWW-Authenticate', 'Basic realm="CRM CardDAV"').json({ error: 'Invalid credentials.' });
      return null;
    }
    return user.id;
  }
  res.status(401).set('WWW-Authenticate', 'Basic realm="CRM CardDAV"').json({ error: 'Authentication required.' });
  return null;
}

// ── vCard helpers ──────────────────────────────────────────────────────────

function escapeVcard(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function toVCARD(contact, phones) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    `UID:${contact.id}@crm`,
    `FN:${escapeVcard([contact.first_name, contact.last_name].filter(Boolean).join(' '))}`,
    `N:${escapeVcard(contact.last_name)};${escapeVcard(contact.first_name)};;;`,
  ];

  if (contact.email) lines.push(`EMAIL;TYPE=work:${escapeVcard(contact.email)}`);
  if (contact.job_title || contact.position) lines.push(`TITLE:${escapeVcard(contact.job_title || contact.position)}`);
  if (contact.company_name) lines.push(`ORG:${escapeVcard(contact.company_name)}`);

  // Multiple phone numbers
  if (phones && phones.length) {
    phones.forEach(p => {
      const type = (p.label || 'work').toUpperCase();
      lines.push(`TEL;TYPE=${type}:${escapeVcard(p.phone_number)}`);
    });
  } else if (contact.phone) {
    lines.push(`TEL;TYPE=work:${escapeVcard(contact.phone)}`);
  }

  if (contact.notes) lines.push(`NOTE:${escapeVcard(contact.notes)}`);

  const rev = new Date(contact.updated_at || contact.created_at).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  lines.push(`REV:${rev}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /carddav/:userId/contacts
 * Returns all CRM contacts as a vCard addressbook.
 */
router.get('/:userId/contacts', async (req, res) => {
  try {
    const callerId = await authenticate(req, res);
    if (!callerId) return;

    // All authenticated users can read the shared addressbook
    const contacts = await db('contacts')
      .leftJoin('companies', 'contacts.company_id', 'companies.id')
      .select(
        'contacts.*',
        'companies.name as company_name',
      )
      .whereNull('contacts.deleted_at')
      .orderBy('contacts.last_name');

    // Batch-load phone numbers
    const contactIds = contacts.map(c => c.id);
    const phones = contactIds.length
      ? await db('contact_phones').whereIn('contact_id', contactIds)
      : [];
    const phonesByContact = phones.reduce((acc, p) => {
      if (!acc[p.contact_id]) acc[p.contact_id] = [];
      acc[p.contact_id].push(p);
      return acc;
    }, {});

    const vcards = contacts.map(c => toVCARD(c, phonesByContact[c.id] || []));

    res.set('Content-Type', 'text/vcard; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="contacts.vcf"');
    return res.send(vcards.join('\r\n\r\n'));
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /carddav/:userId/contacts/:id
 * Returns a single contact as a vCard.
 */
router.get('/:userId/contacts/:id', async (req, res) => {
  try {
    const callerId = await authenticate(req, res);
    if (!callerId) return;

    const contact = await db('contacts')
      .leftJoin('companies', 'contacts.company_id', 'companies.id')
      .select('contacts.*', 'companies.name as company_name')
      .where('contacts.id', req.params.id)
      .whereNull('contacts.deleted_at')
      .first();

    if (!contact) return res.status(404).json({ error: 'Contact not found.' });

    const phones = await db('contact_phones').where({ contact_id: contact.id });

    res.set('Content-Type', 'text/vcard; charset=utf-8');
    return res.send(toVCARD(contact, phones));
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
