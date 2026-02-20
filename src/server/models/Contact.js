'use strict';

const { db } = require('../config/database');

const Contact = {
  async findById(id) {
    return db('contacts').where({ id }).whereNull('deleted_at').first();
  },

  async create(data, createdBy) {
    const [contact] = await db('contacts')
      .insert({ ...data, created_by: createdBy })
      .returning('*');
    return contact;
  },

  async update(id, data) {
    const allowed = ['first_name', 'last_name', 'email', 'phone', 'position', 'notes', 'company_id', 'last_contact_date'];
    const fields = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    fields.updated_at = db.fn.now();
    const [contact] = await db('contacts').where({ id, deleted_at: null }).update(fields).returning('*');
    return contact;
  },

  async softDelete(id) {
    return db('contacts').where({ id }).update({ deleted_at: db.fn.now() });
  },

  async list({ page = 1, limit = 20, search, company_id, sort = 'created_at', order = 'desc' } = {}) {
    const offset = (page - 1) * limit;
    const SORT_WHITELIST = ['first_name', 'last_name', 'email', 'last_contact_date', 'created_at'];
    const sortCol = SORT_WHITELIST.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    let query = db('contacts')
      .leftJoin('companies', 'contacts.company_id', 'companies.id')
      .whereNull('contacts.deleted_at');

    if (search) {
      query = query.where((b) =>
        b.whereILike('contacts.first_name', `%${search}%`)
          .orWhereILike('contacts.last_name', `%${search}%`)
          .orWhereILike('contacts.email', `%${search}%`)
          .orWhereILike('contacts.phone', `%${search}%`),
      );
    }
    if (company_id) query = query.where({ 'contacts.company_id': company_id });

    const [{ count }] = await query.clone().count('contacts.id as count');
    const data = await query
      .select(
        'contacts.*',
        'companies.name as company_name',
      )
      .orderBy(`contacts.${sortCol}`, sortOrder)
      .limit(limit)
      .offset(offset);
    return { data, total: parseInt(count, 10) };
  },

  async updateLastContactDate(id, date) {
    return db('contacts').where({ id }).update({ last_contact_date: date, updated_at: db.fn.now() });
  },

  async getCompany(companyId) {
    return db('companies').where({ id: companyId }).whereNull('deleted_at').first();
  },

  async getNotes(contactId) {
    return db('notes')
      .where({ entity_type: 'contact', entity_id: contactId })
      .orderBy('created_at', 'desc');
  },

  async getProjects(contactId) {
    return db('project_contacts')
      .join('projects', 'project_contacts.project_id', 'projects.id')
      .where('project_contacts.contact_id', contactId)
      .whereNull('projects.deleted_at')
      .select('projects.id', 'projects.name', 'projects.status', 'projects.start_date', 'projects.end_date');
  },
};

module.exports = Contact;
