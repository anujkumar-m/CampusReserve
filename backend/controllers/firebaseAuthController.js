const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { parseEmail, extractNameFromEmail } = require('../utils/emailParser');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// @desc    Verify Firebase Google token and create/login user
// @route   POST /api/auth/google/verify
// @access  Public
exports.verifyGoogleToken = async (req, res) => {
    try {
        const { idToken, email, name, googleId } = req.body;

        console.log('🔍 Firebase token verification for:', email);

        if (!email || !googleId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
        }

        // Parse email to validate and extract role info
        const emailInfo = parseEmail(email);

        if (!emailInfo.isValid) {
            return res.status(403).json({
                success: false,
                message: emailInfo.error,
            });
        }

        // Check if user exists with this email
        let user = await User.findOne({ email });

        if (user) {
            // Update user with Google ID if not already set
            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = 'google';
                await user.save();
                console.log('✅ Updated existing user with Google auth');
            }
        } else {
            // Prepare new user data
            const userData = {
                name: name || extractNameFromEmail(email),
                email,
                googleId,
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
            user = await User.create(userData);
            console.log('✅ Created new user with Google auth');
        }

        // Generate JWT token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                year: user.year,
                clubName: user.clubName,
            },
        });
    } catch (error) {
        console.error('💥 Firebase verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
