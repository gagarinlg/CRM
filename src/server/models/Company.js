'use strict';

const { db } = require('../config/database');

const Company = {
  async findById(id) {
    return db('companies').where({ id }).whereNull('deleted_at').first();
  },

  async create(data, createdBy) {
    const [company] = await db('companies')
      .insert({ ...data, created_by: createdBy })
      .returning('*');
    return company;
  },

  async update(id, data) {
    const allowed = ['name', 'address', 'phone', 'email', 'website', 'industry', 'size', 'notes'];
    const fields = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    fields.updated_at = db.fn.now();
    const [company] = await db('companies').where({ id, deleted_at: null }).update(fields).returning('*');
    return company;
  },

  async softDelete(id) {
    return db('companies').where({ id }).update({ deleted_at: db.fn.now() });
  },

  async list({ page = 1, limit = 20, search, industry, size, sort = 'created_at', order = 'desc' } = {}) {
    const offset = (page - 1) * limit;
    const SORT_WHITELIST = ['name', 'industry', 'size', 'created_at', 'updated_at'];
    const sortCol = SORT_WHITELIST.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    let query = db('companies').whereNull('deleted_at');
    if (search) {
      query = query.where((b) =>
        b.whereILike('name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('phone', `%${search}%`),
      );
    }
    if (industry) query = query.where({ industry });
    if (size) query = query.where({ size });

    const [{ count }] = await query.clone().count('* as count');
    const data = await query.select('*').orderBy(sortCol, sortOrder).limit(limit).offset(offset);
    return { data, total: parseInt(count, 10) };
  },

  async getContacts(companyId) {
    return db('contacts')
      .where({ company_id: companyId })
      .whereNull('deleted_at')
      .select('id', 'first_name', 'last_name', 'email', 'phone', 'position');
  },

  async getProjects(companyId) {
    return db('projects')
      .where({ company_id: companyId })
      .whereNull('deleted_at')
      .select('id', 'name', 'status', 'start_date', 'end_date');
  },

  async getNotes(companyId) {
    return db('notes')
      .where({ entity_type: 'company', entity_id: companyId })
      .orderBy('created_at', 'desc');
  },

  async getLeads(companyId) {
    return db('leads')
      .where({ company_id: companyId })
      .whereNull('deleted_at')
      .select('id', 'title', 'value', 'stage', 'status');
  },
};

module.exports = Company;
