'use strict';

const { body } = require('express-validator');
const Tag = require('../models/Tag');
const { success, error, notFound } = require('../utils/response');

const createValidation = [
  body('name').notEmpty().withMessage('Tag name is required.'),
  body('color').optional().isString(),
];

const tagsController = {
  createValidation,

  async list(req, res, next) {
    try {
      const tags = await Tag.list();
      return success(res, tags);
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const tag = await Tag.create(req.body);
      return success(res, tag, 'Tag created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await Tag.findById(req.params.id);
      if (!existing) return notFound(res, 'Tag not found.');
      const tag = await Tag.update(req.params.id, req.body);
      return success(res, tag, 'Tag updated.');
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await Tag.findById(req.params.id);
      if (!existing) return notFound(res, 'Tag not found.');
      await Tag.delete(req.params.id);
      return success(res, null, 'Tag deleted.');
    } catch (err) {
      return next(err);
    }
  },

  async getEntityTags(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      const tags = await Tag.getTagsForEntity(entityType, entityId);
      return success(res, tags);
    } catch (err) {
      return next(err);
    }
  },

  async addEntityTag(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      const { tag_id } = req.body;
      if (!tag_id) return error(res, 'tag_id is required.', 400);
      const tag = await Tag.findById(tag_id);
      if (!tag) return notFound(res, 'Tag not found.');
      await Tag.addTagToEntity(entityType, entityId, tag_id);
      return success(res, null, 'Tag added.');
    } catch (err) {
      return next(err);
    }
  },

  async removeEntityTag(req, res, next) {
    try {
      const { entityType, entityId, tagId } = req.params;
      await Tag.removeTagFromEntity(entityType, entityId, tagId);
      return success(res, null, 'Tag removed.');
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = tagsController;
