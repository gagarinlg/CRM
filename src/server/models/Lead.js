'use strict';

const { db } = require('../config/database');

const Lead = {
  async findById(id) {
    return db('leads')
      .leftJoin('companies', 'leads.company_id', 'companies.id')
      .leftJoin('contacts', 'leads.contact_id', 'contacts.id')
      .leftJoin('users as assigned_user', 'leads.assigned_to', 'assigned_user.id')
      .where('leads.id', id)
      .whereNull('leads.deleted_at')
      .select(
        'leads.*',
        'companies.name as company_name',
        db.raw("CONCAT(contacts.first_name, ' ', contacts.last_name) as contact_name"),
        db.raw("CONCAT(assigned_user.first_name, ' ', assigned_user.last_name) as assigned_to_name"),
      )
      .first();
  },

  async create(data, createdBy) {
    const allowed = ['title', 'value', 'probability', 'stage', 'source', 'status', 'visibility', 'company_id', 'contact_id', 'assigned_to', 'notes'];
    const fields = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    // Normalize empty string UUID fields to null
    ['company_id', 'contact_id', 'assigned_to'].forEach((f) => { if (fields[f] === '') fields[f] = null; });
    const [lead] = await db('leads')
      .insert({ ...fields, created_by: createdBy })
      .returning('*');
    return lead;
  },

  async update(id, data) {
    const allowed = ['title', 'value', 'probability', 'stage', 'source', 'status', 'visibility', 'company_id', 'contact_id', 'assigned_to'];
    const fields = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    // Normalize empty string UUID fields to null
    ['company_id', 'contact_id', 'assigned_to'].forEach((f) => { if (fields[f] === '') fields[f] = null; });
    fields.updated_at = db.fn.now();
    const [lead] = await db('leads').where({ id, deleted_at: null }).update(fields).returning('*');
    return lead;
  },

  async softDelete(id) {
    return db('leads').where({ id }).update({ deleted_at: db.fn.now() });
  },

  async list({ page = 1, limit = 20, search, stage, status, assigned_to, sort = 'created_at', order = 'desc', user_id, user_groups = [] } = {}) {
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

    // Visibility: admins see all; non-admins see public + their groups + own leads
    if (user_id) {
      query = query.where((b) => {
        b.where('leads.visibility', 'public');
        if (user_groups.length > 0) {
          b.orWhereIn('leads.id', db('lead_groups')
            .whereIn('group_id', user_groups)
            .select('lead_id'));
        }
        b.orWhere('leads.created_by', user_id);
      });
    }

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

    // Batch-fetch tags for all returned leads (two queries, never N+1)
    if (data.length > 0) {
      const ids = data.map((l) => l.id);
      const tagRows = await db('entity_tags')
        .join('tags', 'entity_tags.tag_id', 'tags.id')
        .where('entity_tags.entity_type', 'lead')
        .whereIn('entity_tags.entity_id', ids)
        .select('entity_tags.entity_id as entity_id', 'tags.id', 'tags.name', 'tags.color');
      const tagMap = {};
      tagRows.forEach((r) => {
        if (!tagMap[r.entity_id]) tagMap[r.entity_id] = [];
        tagMap[r.entity_id].push({ id: r.id, name: r.name, color: r.color });
      });
      data.forEach((l) => { l.tags = tagMap[l.id] || []; });
    }

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

  async addGroup(leadId, groupId) {
    await db('lead_groups')
      .insert({ lead_id: leadId, group_id: groupId })
      .onConflict(['lead_id', 'group_id'])
      .ignore();
  },

  async removeGroup(leadId, groupId) {
    return db('lead_groups').where({ lead_id: leadId, group_id: groupId }).delete();
  },

  async getGroups(leadId) {
    return db('lead_groups')
      .join('groups', 'lead_groups.group_id', 'groups.id')
      .where('lead_groups.lead_id', leadId)
      .select('groups.id', 'groups.name', 'groups.description');
  },

  async getContacts(leadId) {
    return db('lead_contacts')
      .join('contacts', 'lead_contacts.contact_id', 'contacts.id')
      .leftJoin('companies', 'contacts.company_id', 'companies.id')
      .where('lead_contacts.lead_id', leadId)
      .select(
        'contacts.id',
        'contacts.first_name',
        'contacts.last_name',
        'contacts.email',
        'contacts.position',
        'companies.name as company_name',
      );
  },

  async addContact(leadId, contactId) {
    await db('lead_contacts')
      .insert({ lead_id: leadId, contact_id: contactId })
      .onConflict(['lead_id', 'contact_id'])
      .ignore();
  },

  async removeContact(leadId, contactId) {
    return db('lead_contacts').where({ lead_id: leadId, contact_id: contactId }).delete();
  },

  async getMembers(leadId) {
    return db('lead_members')
      .join('users', 'lead_members.user_id', 'users.id')
      .where('lead_members.lead_id', leadId)
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email',
        'lead_members.role',
      );
  },

  async addMember(leadId, userId, role) {
    await db('lead_members')
      .insert({ lead_id: leadId, user_id: userId, role: role || null })
      .onConflict(['lead_id', 'user_id'])
      .merge({ role: role || null });
  },

  async removeMember(leadId, userId) {
    return db('lead_members').where({ lead_id: leadId, user_id: userId }).delete();
  },
};

module.exports = Lead;
