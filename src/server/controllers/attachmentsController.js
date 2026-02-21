'use strict';

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Attachment = require('../models/Attachment');
const { success, error, notFound } = require('../utils/response');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

// Allow all file types up to 100 MB
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

const VALID_ENTITY_TYPES = ['project', 'lead'];

const attachmentsController = {
  upload: upload.single('file'),

  async list(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      if (!VALID_ENTITY_TYPES.includes(entityType)) {
        return error(res, 'Invalid entity type.', 400);
      }
      const files = await Attachment.listByEntity(entityType, entityId);
      return success(res, files);
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      if (!VALID_ENTITY_TYPES.includes(entityType)) {
        return error(res, 'Invalid entity type.', 400);
      }
      if (!req.file) {
        return error(res, 'No file uploaded.', 400);
      }
      const attachment = await Attachment.create({
        entity_type: entityType,
        entity_id: entityId,
        filename: req.file.filename,
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size: req.file.size,
        uploaded_by: req.user.id,
      });
      return success(res, attachment, 'File uploaded.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async download(req, res, next) {
    try {
      const attachment = await Attachment.findById(req.params.id);
      if (!attachment) return notFound(res, 'File not found.');
      const filePath = path.join(UPLOAD_DIR, attachment.filename);
      if (!fs.existsSync(filePath)) return notFound(res, 'File not found on disk.');
      res.download(filePath, attachment.original_name);
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const attachment = await Attachment.findById(req.params.id);
      if (!attachment) return notFound(res, 'File not found.');
      // Only uploader or admin can delete
      const userRoles = (req.user.roles || []).map(r => (typeof r === 'string' ? r : r.name || '').toLowerCase());
      if (attachment.uploaded_by !== req.user.id && !userRoles.includes('admin')) {
        return error(res, 'Not authorized to delete this file.', 403);
      }
      const filePath = path.join(UPLOAD_DIR, attachment.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await Attachment.delete(req.params.id);
      return success(res, null, 'File deleted.');
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = attachmentsController;
