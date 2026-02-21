'use strict';

const { db } = require('../config/database');

const Dashboard = {
  async getByUser(userId) {
    return db('dashboard_configs').where({ user_id: userId }).first();
  },

  async create({ user_id, name, layout, widgets }) {
    const [config] = await db('dashboard_configs')
      .insert({ user_id, name, layout, widgets })
      .returning('*');
    return config;
  },

  async update(id, { name, layout, widgets }) {
    const data = {};
    if (name !== undefined) data.name = name;
    if (layout !== undefined) data.layout = JSON.stringify(layout);
    if (widgets !== undefined) data.widgets = JSON.stringify(widgets);
    data.updated_at = db.fn.now();
    const [config] = await db('dashboard_configs').where({ id }).update(data).returning('*');
    return config;
  },

  async delete(id) {
    return db('dashboard_configs').where({ id }).delete();
  },

  async upsertForUser(userId, { name, layout, widgets }) {
    const existing = await this.getByUser(userId);
    if (existing) {
      return this.update(existing.id, { name, layout, widgets });
    }
    return this.create({ user_id: userId, name, layout, widgets });
  },
};

module.exports = Dashboard;
