'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Public routes
router.post('/login', authController.loginValidation, validate, authController.login);
router.post('/refresh', authController.refresh);

// Protected routes
router.use(verifyToken);
router.post('/logout', authController.logout);
router.post('/change-password', authController.changePasswordValidation, validate, authController.changePassword);
router.get('/me', authController.me);

module.exports = router;
