'use strict';

const express = require('express');
const router = express.Router();
const tagsController = require('../controllers/tagsController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', tagsController.list);
router.post('/', tagsController.createValidation, validate, tagsController.create);
router.put('/:id', tagsController.update);
router.delete('/:id', tagsController.delete);

router.get('/:entityType/:entityId', tagsController.getEntityTags);
router.post('/:entityType/:entityId', tagsController.addEntityTag);
router.delete('/:entityType/:entityId/:tagId', tagsController.removeEntityTag);

module.exports = router;
