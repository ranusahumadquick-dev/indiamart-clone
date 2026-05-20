/**
 * Authentication Routes
 * Defines all authentication-related endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { verifyAdmin } = require('../middleware/adminMiddleware');

/**
 * @description  User registration
 * @route        POST /api/auth/register
 * @access       Public
 */
router.post('/register', authController.register);

/**
 * @description  User login
 * @route        POST /api/auth/login
 * @access       Public
 */
router.post('/login', authController.login);

/**
 * @description  User logout
 * @route        POST /api/auth/logout
 * @access       Private
 */
router.post('/logout', protect, authController.logout);

/**
 * @description  Refresh access token
 * @route        POST /api/auth/refresh-token
 * @access       Public
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @description  Get current user profile
 * @route        GET /api/auth/me
 * @access       Private
 */
router.get('/me', protect, authController.getMe);

/**
 * @description  Update user profile
 * @route        PUT /api/auth/profile
 * @access       Private
 */
router.put('/profile', protect, authController.updateProfile);

/**
 * @description  Change password
 * @route        PUT /api/auth/change-password
 * @access       Private
 */
router.put('/change-password', protect, authController.changePassword);

/**
 * @description  Forgot password
 * @route        POST /api/auth/forgot-password
 * @access       Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @description  Reset password with token
 * @route        PUT /api/auth/reset-password/:token
 * @access       Public
 */
router.put('/reset-password/:token', authController.resetPassword);

/**
 * @description  Verify email with token
 * @route        GET /api/auth/verify-email/:token
 * @access       Public
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @description  Resend verification email
 * @route        POST /api/auth/resend-verification
 * @access       Public
 */
router.post('/resend-verification', authController.resendVerificationEmail);

module.exports = router;