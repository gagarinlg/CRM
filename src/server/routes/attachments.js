'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const attachmentsController = require('../controllers/attachmentsController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', attachmentsController.list);
router.post('/', attachmentsController.upload, attachmentsController.create);
router.get('/:id/download', attachmentsController.download);
router.delete('/:id', attachmentsController.delete);

module.exports = router;
