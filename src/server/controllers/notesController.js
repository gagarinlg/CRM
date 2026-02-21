'use strict';

const { body } = require('express-validator');
const Note = require('../models/Note');
const { success, error, notFound } = require('../utils/response');

const VALID_ENTITY_TYPES = ['company', 'contact', 'project', 'lead'];

const createValidation = [
  body('content').notEmpty().withMessage('Note content is required.'),
  body('entity_type').isIn(VALID_ENTITY_TYPES).withMessage(`entity_type must be one of: ${VALID_ENTITY_TYPES.join(', ')}`),
  body('entity_id').isUUID().withMessage('entity_id must be a valid UUID.'),
];

const notesController = {
  createValidation,

  async listByEntity(req, res, next) {
    try {
      const { entity_type, entity_id } = req.query;
      if (!entity_type || !entity_id) return error(res, 'entity_type and entity_id are required.', 400);
      const notes = await Note.listByEntity(entity_type, entity_id, req.user.id);
      return success(res, notes);
    } catch (err) {
      return next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) return notFound(res, 'Note not found.');
      return success(res, note);
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const note = await Note.create({ ...req.body, created_by: req.user.id });
      return success(res, note, 'Note created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await Note.findById(req.params.id);
      if (!existing) return notFound(res, 'Note not found.');
      const userRolesLower = (req.user.roles || []).map((r) => (r.name || r).toLowerCase());
      if (existing.created_by !== req.user.id && !userRolesLower.includes('admin')) {
        return error(res, 'Not authorized to edit this note.', 403);
      }
      const note = await Note.update(req.params.id, req.body);
      return success(res, note, 'Note updated.');
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await Note.findById(req.params.id);
      if (!existing) return notFound(res, 'Note not found.');
      const userRolesLower = (req.user.roles || []).map((r) => (r.name || r).toLowerCase());
      if (existing.created_by !== req.user.id && !userRolesLower.includes('admin')) {
        return error(res, 'Not authorized to delete this note.', 403);
      }
      await Note.delete(req.params.id);
      return success(res, null, 'Note deleted.');
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = notesController;
