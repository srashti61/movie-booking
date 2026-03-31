const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// ✅ Validation middleware
const validateRegister = [
  body('name').not().isEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit phone number')
];

// ✅ Routes

// @route   POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// @route   POST /api/auth/login
router.post('/login', authController.login);

// @route   GET /api/auth/profile
router.get('/profile', auth, authController.getProfile);

// @route   PUT /api/auth/profile
router.put('/profile', auth, authController.updateProfile);

// @route   PUT /api/auth/change-password
router.put('/change-password', auth, authController.changePassword);

module.exports = router;
