'use strict';

const { db } = require('../config/database');

const AuditLog = {
  async create({ user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent }) {
    const [log] = await db('audit_logs')
      .insert({
        user_id: user_id || null,
        action,
        entity_type,
        entity_id: entity_id || null,
        old_values: old_values ? JSON.stringify(old_values) : null,
        new_values: new_values ? JSON.stringify(new_values) : null,
        ip_address: ip_address || null,
        user_agent: user_agent || null,
      })
      .returning('*');
    return log;
  },

  async getById(id) {
    return db('audit_logs').where({ id }).first();
  },

  async list({ page = 1, limit = 20, user_id, entity_type, entity_id, action, from, to } = {}) {
    const offset = (page - 1) * limit;
    let query = db('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id');

    if (user_id) query = query.where('audit_logs.user_id', user_id);
    if (entity_type) query = query.where('audit_logs.entity_type', entity_type);
    if (entity_id) query = query.where('audit_logs.entity_id', entity_id);
    if (action) query = query.where('audit_logs.action', action);
    if (from) query = query.where('audit_logs.created_at', '>=', from);
    if (to) query = query.where('audit_logs.created_at', '<=', to);

    const [{ count }] = await query.clone().count('audit_logs.id as count');
    const data = await query
      .select(
        'audit_logs.*',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as user_name"),
        'users.email as user_email',
      )
      .orderBy('audit_logs.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    return { data, total: parseInt(count, 10) };
  },
};

module.exports = AuditLog;
