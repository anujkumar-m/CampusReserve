const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { parseEmail, extractNameFromEmail } = require('../utils/emailParser');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { email, password, department: manualDepartment } = req.body;
        let { name } = req.body;

        // Parse email to extract role and department
        const emailInfo = parseEmail(email);

        if (!emailInfo.isValid) {
            return res.status(400).json({
                success: false,
                message: emailInfo.error,
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        // Use extracted name if not provided
        if (!name) {
            name = extractNameFromEmail(email);
        }

        // Prepare user data
        const userData = {
            name,
            email,
            password,
            role: emailInfo.role,
            authProvider: 'local'
        };

        // Add department if detected from email
        if (emailInfo.department) {
            userData.department = emailInfo.department;
        } else if (emailInfo.role === 'faculty' && manualDepartment) {
            // Faculty can provide department manually
            userData.department = manualDepartment;
        }

        // Add year for students
        if (emailInfo.year) {
            userData.year = emailInfo.year;
        }

        // Add club name for clubs
        if (emailInfo.clubName) {
            userData.clubName = emailInfo.clubName;
        }

        // Create user
        const user = await User.create(userData);

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
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
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔍 Login attempt:', { email, passwordLength: password?.length });

        // Validate email & password
        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Check for user (include password)
        const user = await User.findOne({ email }).select('+password');
        console.log('👤 User found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('❌ User not found in database');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Ensure user is using local auth provider (not Google)
        if (user.authProvider !== 'local') {
            console.log('❌ User configured for Google auth');
            return res.status(403).json({
                success: false,
                message: 'This account is configured for Google Sign-In. Please use the "Sign in with Google" button.',
            });
        }

        console.log('🔐 Comparing password...');
        // Check if password matches
        const isMatch = await user.comparePassword(password);
        console.log('✅ Password match:', isMatch);

        if (!isMatch) {
            console.log('❌ Password does not match');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate token
        const token = generateToken(user._id);
        console.log('🎉 Login successful for:', user.email);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                clubName: user.clubName,
            },
        });
    } catch (error) {
        console.error('💥 Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
