'use strict';

const { db } = require('../config/database');

const EmailLog = {
  async create({ to_address, subject, html_body, status = 'pending', error_message, sent_at }) {
    const [log] = await db('email_logs')
      .insert({ to_address, subject, html_body, status, error_message, sent_at })
      .returning('*');
    return log;
  },

  async updateStatus(id, status, error_message = null) {
    const data = { status };
    if (status === 'sent') data.sent_at = db.fn.now();
    if (error_message) data.error_message = error_message;
    return db('email_logs').where({ id }).update(data);
  },

  async getById(id) {
    return db('email_logs').where({ id }).first();
  },

  async list({ page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit;
    let query = db('email_logs');
    if (status) query = query.where({ status });
    const [{ count }] = await query.clone().count('* as count');
    const data = await query.select('*').orderBy('created_at', 'desc').limit(limit).offset(offset);
    return { data, total: parseInt(count, 10) };
  },
};

module.exports = EmailLog;
