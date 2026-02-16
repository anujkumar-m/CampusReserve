const User = require('../models/User');

// @desc    Assign role to user by email
// @route   POST /api/roles/assign
// @access  Private/Admin
exports.assignRole = async (req, res) => {
    try {
        const { email, role, department, clubName } = req.body;

        // Validate required fields
        if (!email || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and role',
            });
        }

        // Validate role
        const validRoles = ['admin', 'faculty', 'student', 'department', 'club'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be one of: admin, faculty, student, department, club',
            });
        }

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // Update existing user's role
            user.role = role;
            if (department) user.department = department;
            if (clubName) user.clubName = clubName;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Role updated successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    clubName: user.clubName,
                },
            });
        }

        // User doesn't exist - create a pending role assignment
        // This will be applied when the user signs up with Google
        const pendingUser = await User.create({
            name: email.split('@')[0], // Temporary name from email
            email,
            role,
            department,
            clubName,
            authProvider: 'google',
            // googleId is left undefined until user signs in with Google
        });

        res.status(201).json({
            success: true,
            message: 'Role assigned. User will be created when they sign in with Google.',
            user: {
                id: pendingUser._id,
                email: pendingUser.email,
                role: pendingUser.role,
                department: pendingUser.department,
                clubName: pendingUser.clubName,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all pending role assignments
// @route   GET /api/roles/pending
// @access  Private/Admin
exports.getPendingRoles = async (req, res) => {
    try {
        const pendingUsers = await User.find({
            authProvider: 'google',
            googleId: { $exists: false }
        });

        res.status(200).json({
            success: true,
            count: pendingUsers.length,
            data: pendingUsers,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
