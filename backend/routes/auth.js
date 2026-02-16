const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { googleAuth, googleAuthCallback } = require('../controllers/googleAuthController');
const { verifyGoogleToken } = require('../controllers/firebaseAuthController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Google OAuth routes (Passport.js - optional fallback)
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

// Firebase Google Sign-In verification
router.post('/google/verify', verifyGoogleToken);

module.exports = router;
