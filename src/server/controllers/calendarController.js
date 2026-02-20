'use strict';

const { body } = require('express-validator');
const Event = require('../models/Event');
const { success, error, notFound } = require('../utils/response');

const createValidation = [
  body('title').notEmpty().withMessage('Event title is required.'),
  body('start_datetime').isISO8601().withMessage('start_datetime must be a valid ISO 8601 date.'),
  body('end_datetime').isISO8601().withMessage('end_datetime must be a valid ISO 8601 date.'),
];

const calendarController = {
  createValidation,

  async list(req, res, next) {
    try {
      const { start, end } = req.query;
      if (!start || !end) return error(res, 'start and end query params are required.', 400);
      const events = await Event.listByDateRange(start, end, req.query.user_id);
      return success(res, events);
    } catch (err) {
      return next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return notFound(res, 'Event not found.');
      return success(res, event);
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const event = await Event.create(req.body, req.user.id);
      return success(res, event, 'Event created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await Event.findById(req.params.id);
      if (!existing) return notFound(res, 'Event not found.');
      const event = await Event.update(req.params.id, req.body);
      return success(res, event, 'Event updated.');
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await Event.findById(req.params.id);
      if (!existing) return notFound(res, 'Event not found.');
      await Event.delete(req.params.id);
      return success(res, null, 'Event deleted.');
    } catch (err) {
      return next(err);
    }
  },

  async listByEntity(req, res, next) {
    try {
      const { entity_type, entity_id } = req.query;
      if (!entity_type || !entity_id) return error(res, 'entity_type and entity_id are required.', 400);
      const events = await Event.listByEntity(entity_type, entity_id);
      return success(res, events);
    } catch (err) {
      return next(err);
    }
  },

  async getRecurring(req, res, next) {
    try {
      const events = await Event.getRecurring();
      return success(res, events);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = calendarController;
