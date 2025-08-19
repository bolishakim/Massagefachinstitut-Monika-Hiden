import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  loginMFA,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  verifyEmail,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Registration validation
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
];

// Login validation - support both email and username
const loginValidation = [
  body('password').exists(),
  // Custom validation for email OR username
  body().custom((value, { req }) => {
    const { email, username } = req.body;
    
    if (!email && !username) {
      throw new Error('Either email or username is required');
    }
    
    // Validate email format if email is provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate username format if username is provided (alphanumeric with dots allowed)
    if (username && !/^[a-zA-Z0-9._-]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, dots, underscores, and hyphens');
    }
    
    return true;
  })
];

// MFA login validation
const loginMFAValidation = [
  body('tempToken').exists(),
  body('mfaToken').isLength({ min: 6, max: 8 }).isAlphanumeric(),
];

// Password reset validation
const resetPasswordValidation = [
  body('token').exists(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

// Profile update validation
const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
];

// Routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/login-mfa', loginMFAValidation, validate, loginMFA);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', body('email').isEmail().normalizeEmail(), validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);
router.post('/verify-email', body('token').exists(), validate, verifyEmail);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, validate, updateProfile);

export default router;