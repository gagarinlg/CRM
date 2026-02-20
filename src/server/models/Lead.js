'use strict';

const { db } = require('../config/database');

const Lead = {
  async findById(id) {
    return db('leads').where({ id }).whereNull('deleted_at').first();
  },

  async create(data, createdBy) {
    const [lead] = await db('leads')
      .insert({ ...data, created_by: createdBy })
      .returning('*');
    return lead;
  },

  async update(id, data) {
    const allowed = ['title', 'value', 'probability', 'stage', 'source', 'status', 'company_id', 'contact_id', 'assigned_to'];
    const fields = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    fields.updated_at = db.fn.now();
    const [lead] = await db('leads').where({ id, deleted_at: null }).update(fields).returning('*');
    return lead;
  },

  async softDelete(id) {
    return db('leads').where({ id }).update({ deleted_at: db.fn.now() });
  },

  async list({ page = 1, limit = 20, search, stage, status, assigned_to, sort = 'created_at', order = 'desc' } = {}) {
    const offset = (page - 1) * limit;
    const SORT_WHITELIST = ['title', 'value', 'probability', 'stage', 'status', 'created_at'];
    const sortCol = SORT_WHITELIST.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    let query = db('leads')
      .leftJoin('companies', 'leads.company_id', 'companies.id')
      .leftJoin('contacts', 'leads.contact_id', 'contacts.id')
      .leftJoin('users as assigned_user', 'leads.assigned_to', 'assigned_user.id')
      .whereNull('leads.deleted_at');

    if (search) {
      query = query.where((b) =>
        b.whereILike('leads.title', `%${search}%`)
          .orWhereILike('leads.source', `%${search}%`),
      );
    }
    if (stage) query = query.where('leads.stage', stage);
    if (status) query = query.where('leads.status', status);
    if (assigned_to) query = query.where('leads.assigned_to', assigned_to);

    const [{ count }] = await query.clone().count('leads.id as count');
    const data = await query
      .select(
        'leads.*',
        'companies.name as company_name',
        db.raw("CONCAT(contacts.first_name, ' ', contacts.last_name) as contact_name"),
        db.raw("CONCAT(assigned_user.first_name, ' ', assigned_user.last_name) as assigned_to_name"),
      )
      .orderBy(`leads.${sortCol}`, sortOrder)
      .limit(limit)
      .offset(offset);
    return { data, total: parseInt(count, 10) };
  },

  async moveStage(id, stage) {
    const [lead] = await db('leads')
      .where({ id, deleted_at: null })
      .update({ stage, updated_at: db.fn.now() })
      .returning('*');
    return lead;
  },

  async getPipelineStats() {
    return db('leads')
      .whereNull('deleted_at')
      .where('status', 'open')
      .groupBy('stage')
      .select('stage')
      .count('* as count')
      .sum('value as total_value');
  },

  async getConversionStats() {
    const total = await db('leads').whereNull('deleted_at').count('* as count').first();
    const won = await db('leads').whereNull('deleted_at').where('status', 'won').count('* as count').first();
    const lost = await db('leads').whereNull('deleted_at').where('status', 'lost').count('* as count').first();
    const totalWonValue = await db('leads').whereNull('deleted_at').where('status', 'won').sum('value as total').first();

    return {
      total: parseInt(total.count, 10),
      won: parseInt(won.count, 10),
      lost: parseInt(lost.count, 10),
      conversion_rate: total.count > 0 ? ((won.count / total.count) * 100).toFixed(2) : 0,
      total_won_value: parseFloat(totalWonValue.total || 0),
    };
  },
};

module.exports = Lead;
