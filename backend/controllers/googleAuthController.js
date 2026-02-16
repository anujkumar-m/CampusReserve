const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { parseEmail, extractNameFromEmail } = require('../utils/emailParser');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// Configure Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;

                // Parse email to validate and extract role info
                const emailInfo = parseEmail(email);

                if (!emailInfo.isValid) {
                    return done(new Error(emailInfo.error), null);
                }

                // Check if user already exists
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    // User exists, return user
                    return done(null, user);
                }

                // Check if user exists with same email (pending role assignment or migration)
                user = await User.findOne({ email });

                if (user) {
                    // Update existing user to use Google auth
                    user.googleId = profile.id;
                    user.authProvider = 'google';
                    await user.save();
                    return done(null, user);
                }

                // Prepare new user data
                const userData = {
                    name: profile.displayName || extractNameFromEmail(email),
                    email,
                    googleId: profile.id,
                    authProvider: 'google',
                    role: emailInfo.role
                };

                // Add department if detected
                if (emailInfo.department) {
                    userData.department = emailInfo.department;
                }

                // Add year for students
                if (emailInfo.year) {
                    userData.year = emailInfo.year;
                }

                // Add club name for clubs
                if (emailInfo.clubName) {
                    userData.clubName = emailInfo.clubName;
                }

                // Create new user
                const newUser = await User.create(userData);

                done(null, newUser);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

// @desc    Initiate Google OAuth
// @route   GET /api/auth/google
// @access  Public
exports.googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err) {
            console.error('Google auth error:', err);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }

        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
        }

        // Check if user is infraAdmin or itAdmin (admins cannot use Google login)
        if (user.role === 'infraAdmin' || user.role === 'itAdmin') {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=admin_must_use_manual_login`);
        }

        // Generate token
        const token = generateToken(user._id);

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            clubName: user.clubName,
        }))}`);
    })(req, res, next);
};
