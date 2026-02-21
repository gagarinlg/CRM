'use strict';

const { db } = require('../config/database');

const Company = {
  async findById(id) {
    return db('companies').where({ id }).whereNull('deleted_at').first();
  },

  async create(data, createdBy) {
    const allowed = ['name', 'address', 'city', 'country', 'postal_code', 'vat_number', 'phone', 'email', 'website', 'industry', 'size', 'notes'];
    const fields = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    const [company] = await db('companies')
      .insert({ ...fields, created_by: createdBy })
      .returning('*');
    return company;
  },

  async update(id, data) {
    const allowed = ['name', 'address', 'city', 'country', 'postal_code', 'vat_number', 'phone', 'email', 'website', 'industry', 'size', 'notes'];
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
    const data = await query
      .select('companies.*')
      .orderBy(sortCol, sortOrder)
      .limit(limit)
      .offset(offset);

    // Batch-fetch tags for all returned companies (two queries, never N+1)
    if (data.length > 0) {
      const ids = data.map((c) => c.id);
      const tagRows = await db('entity_tags')
        .join('tags', 'entity_tags.tag_id', 'tags.id')
        .where('entity_tags.entity_type', 'company')
        .whereIn('entity_tags.entity_id', ids)
        .select('entity_tags.entity_id as entity_id', 'tags.id', 'tags.name', 'tags.color');
      const tagMap = {};
      tagRows.forEach((r) => {
        if (!tagMap[r.entity_id]) tagMap[r.entity_id] = [];
        tagMap[r.entity_id].push({ id: r.id, name: r.name, color: r.color });
      });
      data.forEach((c) => { c.tags = tagMap[c.id] || []; });
    }

    return { data, total: parseInt(count, 10) };
  },

  async getContacts(companyId) {
    return db('contacts')
      .leftJoin(
        db('contact_phones').where({ is_primary: true }).select('contact_id', 'phone_number').as('cp'),
        'contacts.id', 'cp.contact_id',
      )
      .where({ company_id: companyId })
      .whereNull('deleted_at')
      .select('contacts.id', 'contacts.first_name', 'contacts.last_name', 'contacts.email', 'cp.phone_number as phone', 'contacts.position');
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
