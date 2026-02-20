'use strict';

const { db } = require('../config/database');

const Note = {
  async findById(id) {
    return db('notes').where({ id }).first();
  },

  async create({ content, entity_type, entity_id, created_by }) {
    const [note] = await db('notes')
      .insert({ content, entity_type, entity_id, created_by })
      .returning('*');
    return note;
  },

  async update(id, { content }) {
    const [note] = await db('notes')
      .where({ id })
      .update({ content, updated_at: db.fn.now() })
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
