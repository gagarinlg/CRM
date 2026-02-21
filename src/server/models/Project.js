'use strict';

const { db } = require('../config/database');

const Project = {
  async findById(id) {
    return db('projects').where({ id }).whereNull('deleted_at').first();
  },

  async create(data, createdBy) {
    const allowed = ['name', 'description', 'status', 'start_date', 'end_date', 'budget', 'company_id', 'progress', 'visibility'];
    const fields = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    // Normalize empty string UUID/date fields to null
    ['company_id', 'start_date', 'end_date'].forEach((f) => { if (fields[f] === '') fields[f] = null; });
    const [project] = await db('projects')
      .insert({ ...fields, created_by: createdBy })
      .returning('*');
    return project;
  },

  async update(id, data) {
    const allowed = ['name', 'description', 'status', 'start_date', 'end_date', 'budget', 'company_id', 'progress', 'visibility'];
    const fields = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    // Normalize empty string UUID/date fields to null
    ['company_id', 'start_date', 'end_date'].forEach((f) => { if (fields[f] === '') fields[f] = null; });
    fields.updated_at = db.fn.now();
    const [project] = await db('projects').where({ id, deleted_at: null }).update(fields).returning('*');
    return project;
  },

  async softDelete(id) {
    return db('projects').where({ id }).update({ deleted_at: db.fn.now() });
  },

  async list({ page = 1, limit = 20, search, status, company_id, sort = 'created_at', order = 'desc', user_id, user_groups = [] } = {}) {
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

    // Visibility filter: show public projects + restricted projects the user has access to
    // Admins/managers (no user_id restriction) see all
    if (user_id) {
      query = query.where((b) => {
        b.where('projects.visibility', 'public');
        if (user_groups.length > 0) {
          b.orWhereIn('projects.id', db('project_groups')
            .whereIn('group_id', user_groups)
            .select('project_id'));
        }
        // Creator always sees their own projects
        b.orWhere('projects.created_by', user_id);
      });
    }

    const [{ count }] = await query.clone().count('projects.id as count');
    const data = await query
      .select('projects.*', 'companies.name as company_name')
      .orderBy(`projects.${sortCol}`, sortOrder)
      .limit(limit)
      .offset(offset);

    // Batch-fetch tags for all returned projects (two queries, never N+1)
    if (data.length > 0) {
      const ids = data.map((p) => p.id);
      const tagRows = await db('entity_tags')
        .join('tags', 'entity_tags.tag_id', 'tags.id')
        .where('entity_tags.entity_type', 'project')
        .whereIn('entity_tags.entity_id', ids)
        .select('entity_tags.entity_id as entity_id', 'tags.id', 'tags.name', 'tags.color');
      const tagMap = {};
      tagRows.forEach((r) => {
        if (!tagMap[r.entity_id]) tagMap[r.entity_id] = [];
        tagMap[r.entity_id].push({ id: r.id, name: r.name, color: r.color });
      });
      data.forEach((p) => { p.tags = tagMap[p.id] || []; });
    }

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
      .leftJoin(
        db('contact_phones').where({ is_primary: true }).select('contact_id', 'phone_number').as('primary_phone'),
        'primary_phone.contact_id', 'contacts.id',
      )
      .where('project_contacts.project_id', projectId)
      .whereNull('contacts.deleted_at')
      .select('contacts.id', 'contacts.first_name', 'contacts.last_name', 'contacts.email',
        'primary_phone.phone_number as phone');
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
      .leftJoin('users', 'notes.created_by', 'users.id')
      .where({ 'notes.entity_type': 'project', 'notes.entity_id': projectId })
      .select(
        'notes.*',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as created_by_name"),
      )
      .orderBy('notes.created_at', 'desc');
  },

  async addGroup(projectId, groupId) {
    await db('project_groups')
      .insert({ project_id: projectId, group_id: groupId })
      .onConflict(['project_id', 'group_id'])
      .ignore();
  },

  async removeGroup(projectId, groupId) {
    return db('project_groups').where({ project_id: projectId, group_id: groupId }).delete();
  },

  async getGroups(projectId) {
    return db('project_groups')
      .join('groups', 'project_groups.group_id', 'groups.id')
      .where('project_groups.project_id', projectId)
      .select('groups.id', 'groups.name', 'groups.description');
  },
};

module.exports = Project;
