'use strict';

const { db } = require('../config/database');

const Project = {
  async findById(id) {
    return db('projects').where({ id }).whereNull('deleted_at').first();
  },

  async create(data, createdBy) {
    const allowed = ['name', 'description', 'status', 'start_date', 'end_date', 'budget', 'company_id', 'progress'];
    const fields = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    const [project] = await db('projects')
      .insert({ ...fields, created_by: createdBy })
      .returning('*');
    return project;
  },

  async update(id, data) {
    const allowed = ['name', 'description', 'status', 'start_date', 'end_date', 'budget', 'company_id', 'progress'];
    const fields = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    fields.updated_at = db.fn.now();
    const [project] = await db('projects').where({ id, deleted_at: null }).update(fields).returning('*');
    return project;
  },

  async softDelete(id) {
    return db('projects').where({ id }).update({ deleted_at: db.fn.now() });
  },

  async list({ page = 1, limit = 20, search, status, company_id, sort = 'created_at', order = 'desc' } = {}) {
    const offset = (page - 1) * limit;
    const SORT_WHITELIST = ['name', 'status', 'start_date', 'end_date', 'budget', 'created_at'];
    const sortCol = SORT_WHITELIST.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    let query = db('projects')
      .leftJoin('companies', 'projects.company_id', 'companies.id')
      .whereNull('projects.deleted_at');

    if (search) {
      query = query.where((b) =>
        b.whereILike('projects.name', `%${search}%`)
          .orWhereILike('projects.description', `%${search}%`),
      );
    }
    if (status) query = query.where('projects.status', status);
    if (company_id) query = query.where('projects.company_id', company_id);

    const [{ count }] = await query.clone().count('projects.id as count');
    const data = await query
      .select('projects.*', 'companies.name as company_name')
      .orderBy(`projects.${sortCol}`, sortOrder)
      .limit(limit)
      .offset(offset);
    return { data, total: parseInt(count, 10) };
  },

  async addContact(projectId, contactId) {
    await db('project_contacts')
      .insert({ project_id: projectId, contact_id: contactId })
      .onConflict(['project_id', 'contact_id'])
      .ignore();
  },

  async removeContact(projectId, contactId) {
    return db('project_contacts').where({ project_id: projectId, contact_id: contactId }).delete();
  },

  async getContacts(projectId) {
    return db('project_contacts')
      .join('contacts', 'project_contacts.contact_id', 'contacts.id')
      .where('project_contacts.project_id', projectId)
      .whereNull('contacts.deleted_at')
      .select('contacts.id', 'contacts.first_name', 'contacts.last_name', 'contacts.email', 'contacts.phone');
  },

  async addMember(projectId, userId, role) {
    await db('project_members')
      .insert({ project_id: projectId, user_id: userId, role })
      .onConflict(['project_id', 'user_id'])
      .merge({ role });
  },

  async removeMember(projectId, userId) {
    return db('project_members').where({ project_id: projectId, user_id: userId }).delete();
  },

  async getMembers(projectId) {
    return db('project_members')
      .join('users', 'project_members.user_id', 'users.id')
      .where('project_members.project_id', projectId)
      .whereNull('users.deleted_at')
      .select(
        'users.id', 'users.email', 'users.username', 'users.first_name', 'users.last_name',
        'project_members.role',
      );
  },

  async getNotes(projectId) {
    return db('notes')
      .where({ entity_type: 'project', entity_id: projectId })
      .orderBy('created_at', 'desc');
  },
};

module.exports = Project;
