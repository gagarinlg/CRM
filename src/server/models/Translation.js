'use strict';

const { db } = require('../config/database');

const Translation = {
  async getByLanguage(languageCode) {
    const rows = await db('translations').where({ language_code: languageCode });
    return rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
  },

  async getByKey(key, languageCode) {
    const query = db('translations').where({ key });
    if (languageCode) query.where({ language_code: languageCode });
    return query;
  },

  async create({ language_code, key, value, module: mod }) {
    const [t] = await db('translations')
      .insert({ language_code, key, value, module: mod })
      .returning('*');
    return t;
  },

  async update(id, { value }) {
    const [t] = await db('translations')
      .where({ id })
      .update({ value, updated_at: db.fn.now() })
      .returning('*');
    return t;
  },

  async delete(id) {
    return db('translations').where({ id }).delete();
  },

  async listKeys({ language_code, module: mod } = {}) {
    let query = db('translations').select('*').orderBy('key');
    if (language_code) query = query.where({ language_code });
    if (mod) query = query.where({ module: mod });
    return query;
  },

  async getLanguages() {
    return db('languages').select('*').orderBy('name');
  },

  async getActiveLanguages() {
    return db('languages').where({ is_active: true }).orderBy('name');
  },

  async getModules() {
    return db('translations').distinct('module').whereNotNull('module').orderBy('module').pluck('module');
  },

  async upsert({ language_code, key, value, module: mod }) {
    const existing = await db('translations').where({ language_code, key }).first();
    if (existing) {
      return this.update(existing.id, { value });
    }
    return this.create({ language_code, key, value, module: mod });
  },
};

module.exports = Translation;
