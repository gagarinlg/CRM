'use strict';

const { db } = require('../config/database');

const Note = {
  async findById(id) {
    return db('notes').where({ id }).first();
  },

  async create({ content, type, entity_type, entity_id, created_by }) {
    const [note] = await db('notes')
      .insert({ content, type: type || 'general', entity_type, entity_id, created_by })
      .returning('*');
    return note;
  },

  async update(id, { content, type }) {
    const fields = { updated_at: db.fn.now() };
    if (content !== undefined) fields.content = content;
    if (type !== undefined) fields.type = type;
    const [note] = await db('notes')
      .where({ id })
      .update(fields)
      .returning('*');
    return note;
  },

  async delete(id) {
    return db('notes').where({ id }).delete();
  },

  async listByEntity(entity_type, entity_id) {
    return db('notes')
      .leftJoin('users', 'notes.created_by', 'users.id')
      .where({ 'notes.entity_type': entity_type, 'notes.entity_id': entity_id })
      .select(
        'notes.*',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as created_by_name"),
      )
      .orderBy('notes.created_at', 'desc');
  },
};

module.exports = Note;
