'use strict';

const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', leadsController.list);
router.get('/stats/pipeline', leadsController.getPipelineStats);
router.get('/stats/conversion', leadsController.getConversionStats);
router.get('/:id', leadsController.getById);
router.post('/', leadsController.createValidation, validate, leadsController.create);
router.put('/:id', leadsController.update);
router.delete('/:id', leadsController.delete);
router.patch('/:id/stage', leadsController.moveStage);
router.get('/:id/notes', leadsController.getNotes);
router.get('/:id/groups', leadsController.getGroups);
router.post('/:id/groups', leadsController.addGroup);
router.delete('/:id/groups/:groupId', leadsController.removeGroup);
router.post('/:id/convert', leadsController.convertToProject);

module.exports = router;
