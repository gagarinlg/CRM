'use strict';

const { db } = require('../config/database');

const Attachment = {
  async listByEntity(entityType, entityId) {
    return db('attachments')
      .leftJoin('users', 'attachments.uploaded_by', 'users.id')
      .where({ 'attachments.entity_type': entityType, 'attachments.entity_id': entityId })
      .select(
        'attachments.*',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as uploaded_by_name"),
      )
      .orderBy('attachments.created_at', 'desc');
  },

  async create({ entity_type, entity_id, filename, original_name, mime_type, size, uploaded_by }) {
    const [row] = await db('attachments')
      .insert({ entity_type, entity_id, filename, original_name, mime_type, size, uploaded_by })
      .returning('*');
    return row;
  },

  async findById(id) {
    return db('attachments').where({ id }).first();
  },

  async delete(id) {
    return db('attachments').where({ id }).delete();
  },
};

module.exports = Attachment;
