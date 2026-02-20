'use strict';

const { body } = require('express-validator');
const Contact = require('../models/Contact');
const AuditLog = require('../models/AuditLog');
const { success, paginated, notFound } = require('../utils/response');

const createValidation = [
  body('first_name').notEmpty().withMessage('First name is required.'),
  body('last_name').notEmpty().withMessage('Last name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email address is required.'),
  body('phones').optional().isArray().withMessage('phones must be an array.'),
  body('phones.*.phone_number').if(body('phones').exists()).notEmpty().withMessage('Each phone entry must have a phone_number.'),
  body('phones.*.label').optional().isIn(['mobile', 'work', 'home', 'fax', 'other']).withMessage('Phone label must be mobile, work, home, fax, or other.'),
];

const contactsController = {
  createValidation,

  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, company_id, sort, order } = req.query;
      const result = await Contact.list({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        company_id,
        sort,
        order,
      });
      return paginated(res, result.data, result.total, parseInt(page, 10), parseInt(limit, 10));
    } catch (err) {
      return next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const contact = await Contact.findById(req.params.id);
      if (!contact) return notFound(res, 'Contact not found.');
      return success(res, contact);
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const contact = await Contact.create(req.body, req.user.id);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'create_contact',
        entity_type: 'contact',
        entity_id: contact.id,
        new_values: contact,
        ip_address: req.ip,
      });
      return success(res, contact, 'Contact created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await Contact.findById(req.params.id);
      if (!existing) return notFound(res, 'Contact not found.');
      const contact = await Contact.update(req.params.id, req.body);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'update_contact',
        entity_type: 'contact',
        entity_id: req.params.id,
        old_values: existing,
        new_values: contact,
        ip_address: req.ip,
      });
      return success(res, contact, 'Contact updated.');
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await Contact.findById(req.params.id);
      if (!existing) return notFound(res, 'Contact not found.');
      await Contact.softDelete(req.params.id);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'delete_contact',
        entity_type: 'contact',
        entity_id: req.params.id,
        ip_address: req.ip,
      });
      return success(res, null, 'Contact deleted.');
    } catch (err) {
      return next(err);
    }
  },

  async updateLastContact(req, res, next) {
    try {
      const contact = await Contact.findById(req.params.id);
      if (!contact) return notFound(res, 'Contact not found.');
      const date = req.body.date || new Date().toISOString().slice(0, 10);
      await Contact.updateLastContactDate(req.params.id, date);
      return success(res, null, 'Last contact date updated.');
    } catch (err) {
      return next(err);
    }
  },

  async getNotes(req, res, next) {
    try {
      const contact = await Contact.findById(req.params.id);
      if (!contact) return notFound(res, 'Contact not found.');
      const notes = await Contact.getNotes(req.params.id);
      return success(res, notes);
    } catch (err) {
      return next(err);
    }
  },

  async getProjects(req, res, next) {
    try {
      const contact = await Contact.findById(req.params.id);
      if (!contact) return notFound(res, 'Contact not found.');
      const projects = await Contact.getProjects(req.params.id);
      return success(res, projects);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = contactsController;
