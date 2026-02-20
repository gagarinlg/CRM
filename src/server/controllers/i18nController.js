'use strict';

const { body } = require('express-validator');
const Translation = require('../models/Translation');
const { success, error, notFound } = require('../utils/response');

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
};

module.exports = i18nController;
