'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { totpVerifyLoginValidation, totpVerifySetupValidation, totpDisableValidation } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Public routes
router.post('/login', authController.loginValidation, validate, authController.login);
router.post('/refresh', authController.refresh);

// TOTP login completion — public (uses pre_auth_token instead of a real JWT)
router.post('/2fa/verify', totpVerifyLoginValidation, validate, authController.totpVerifyLogin);

// Protected routes
router.use(verifyToken);
router.post('/logout', authController.logout);
router.post('/change-password', authController.changePasswordValidation, validate, authController.changePassword);
router.get('/me', authController.me);

// TOTP setup/management — require a full (non-pre-auth) JWT
router.post('/2fa/setup', authController.totpSetup);
router.post('/2fa/verify-setup', totpVerifySetupValidation, validate, authController.totpVerifySetup);
router.post('/2fa/disable', totpDisableValidation, validate, authController.totpDisable);

module.exports = router;
