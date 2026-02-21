'use strict';

const { db } = require('../config/database');

const Event = {
  async findById(id) {
    return db('events').where({ id }).first();
  },

  async create(data, createdBy) {
    const allowed = ['title', 'type', 'description', 'location', 'start_datetime', 'end_datetime', 'is_all_day', 'recurrence_rule', 'entity_type', 'entity_id'];
    const fields = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    const [event] = await db('events')
      .insert({ ...fields, created_by: createdBy })
      .returning('*');
    return event;
  },

  async update(id, data) {
    const allowed = ['title', 'type', 'description', 'location', 'start_datetime', 'end_datetime', 'is_all_day', 'recurrence_rule', 'entity_type', 'entity_id'];
    const fields = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    fields.updated_at = db.fn.now();
    const [event] = await db('events').where({ id }).update(fields).returning('*');
    return event;
  },

  async delete(id) {
    return db('events').where({ id }).delete();
  },

  async listByDateRange(start, end, userId) {
    let query = db('events');
    if (start) query = query.where('start_datetime', '>=', start);
    if (end) query = query.where('end_datetime', '<=', end);
    if (userId) query = query.where('created_by', userId);
    return query.orderBy('start_datetime');
  },

  async listByEntity(entity_type, entity_id) {
    return db('events')
      .where({ entity_type, entity_id })
      .orderBy('start_datetime');
  },

  async getRecurring() {
    return db('events').whereNotNull('recurrence_rule').orderBy('start_datetime');
  },
};

module.exports = Event;
