'use strict';

const { body } = require('express-validator');
const Translation = require('../models/Translation');
const { success, notFound } = require('../utils/response');

const createValidation = [
  body('language_code').notEmpty().withMessage('language_code is required.'),
  body('key').notEmpty().withMessage('key is required.'),
  body('value').notEmpty().withMessage('value is required.'),
];

const i18nController = {
  createValidation,

  /** Public – get all translations for a language as a flat key/value map */
  async getByLanguage(req, res, next) {
    try {
      const { lang } = req.params;
      const translations = await Translation.getByLanguage(lang);
      return success(res, translations);
    } catch (err) {
      return next(err);
    }
  },

  async getLanguages(req, res, next) {
    try {
      const languages = await Translation.getActiveLanguages();
      return success(res, languages);
    } catch (err) {
      return next(err);
    }
  },

  async getAllLanguages(req, res, next) {
    try {
      const languages = await Translation.getLanguages();
      return success(res, languages);
    } catch (err) {
      return next(err);
    }
  },

  async getModules(req, res, next) {
    try {
      const modules = await Translation.getModules();
      return success(res, modules);
    } catch (err) {
      return next(err);
    }
  },

  async listKeys(req, res, next) {
    try {
      const { language_code, module } = req.query;
      const keys = await Translation.listKeys({ language_code, module });
      return success(res, keys);
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const t = await Translation.create(req.body);
      return success(res, t, 'Translation created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const t = await Translation.update(req.params.id, req.body);
      if (!t) return notFound(res, 'Translation not found.');
      return success(res, t, 'Translation updated.');
    } catch (err) {
      return next(err);
    }
  },

  async upsert(req, res, next) {
    try {
      const t = await Translation.upsert(req.body);
      return success(res, t, 'Translation saved.');
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await Translation.delete(req.params.id);
      return success(res, null, 'Translation deleted.');
    } catch (err) {
      return next(err);
    }
  },

  // ── Language management ────────────────────────────────────────────────────

  async createLanguage(req, res, next) {
    try {
      const { code, name, is_active, is_default } = req.body;
      if (!code || !name) return next(Object.assign(new Error('code and name are required.'), { status: 400 }));
      const lang = await Translation.createLanguage({ code, name, is_active, is_default });
      return success(res, lang, 'Language created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async updateLanguage(req, res, next) {
    try {
      const lang = await Translation.updateLanguage(req.params.id, req.body);
      if (!lang) return notFound(res, 'Language not found.');
      return success(res, lang, 'Language updated.');
    } catch (err) {
      return next(err);
    }
  },

  async deleteLanguage(req, res, next) {
    try {
      await Translation.deleteLanguage(req.params.id);
      return success(res, null, 'Language deleted.');
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = i18nController;
