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

  // ── Language management ─────────────────────────────────────────────────────

  async createLanguage({ code, name, is_active = true, is_default = false }) {
    const [lang] = await db('languages')
      .insert({ code: code.toLowerCase(), name, is_active, is_default })
      .returning('*');
    return lang;
  },

  async updateLanguage(id, { name, is_active, is_default }) {
    const data = {};
    if (name !== undefined) data.name = name;
    if (is_active !== undefined) data.is_active = is_active;
    if (is_default !== undefined) data.is_default = is_default;
    const [lang] = await db('languages').where({ id }).update(data).returning('*');
    return lang;
  },

  async deleteLanguage(id) {
    // Guard: ensure at least one language remains
    const count = await db('languages').count('id as n').first();
    if (parseInt(count.n, 10) <= 1) {
      throw Object.assign(new Error('Cannot delete the last language.'), { status: 400 });
    }
    return db('languages').where({ id }).delete();
  },
};

module.exports = Translation;
