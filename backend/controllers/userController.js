const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

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

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const currentUserId = req.user._id.toString();
        const currentUserRole = req.user.role;

        // Check if user is updating themselves or is an admin
        const isAdmin = ['admin', 'infraAdmin', 'itAdmin', 'infrastructure', 'itService'].includes(currentUserRole);
        const isSelf = userId === currentUserId;

        if (!isAdmin && !isSelf) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this user'
            });
        }

        // If not admin, restrict what they can update
        if (!isAdmin) {
            // Non-admins can only update their own name, department, or clubName
            const allowedFields = ['name', 'department', 'clubName'];
            const updates = Object.keys(req.body);
            const isInvalidOperation = updates.some((update) => !allowedFields.includes(update));

            if (isInvalidOperation) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid updates! Users can only update their name, department, or club name.'
                });
            }
        }

        // Don't allow password update through this route
        if (req.body.password) {
            delete req.body.password;
        }

        const user = await User.findByIdAndUpdate(userId, req.body, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

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

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent admin from deleting themselves
        if (userId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete yourself'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Check for active bookings
        const Booking = require('../models/Booking');
        const activeBookingsCount = await Booking.countDocuments({
            userId: userId,
            status: { $in: ['pending_hod', 'pending_admin', 'auto_approved', 'approved'] }
        });

        if (activeBookingsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete user with ${activeBookingsCount} active booking(s). Please cancel or complete them first.`
            });
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Block user
// @route   PUT /api/users/:id/block
// @access  Private/Admin
exports.blockUser = async (req, res) => {
    try {
        const { reason } = req.body;
        const userId = req.params.id;

        // Prevent admin from blocking themselves
        if (userId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot block yourself'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(400).json({
                success: false,
                message: 'User is already blocked'
            });
        }

        // Block the user
        user.isActive = false;
        user.blockedAt = new Date();
        user.blockedBy = req.user._id;
        await user.save();

        // Cancel all pending/approved bookings
        const Booking = require('../models/Booking');
        await Booking.updateMany(
            {
                userId: userId,
                status: { $in: ['pending_hod', 'pending_admin', 'auto_approved', 'approved'] }
            },
            {
                status: 'cancelled',
                rejectionReason: `User blocked: ${reason || 'Administrative action'}`
            }
        );

        res.status(200).json({
            success: true,
            message: 'User blocked successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Unblock user
// @route   PUT /api/users/:id/unblock
// @access  Private/Admin
exports.unblockUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isActive) {
            return res.status(400).json({
                success: false,
                message: 'User is not blocked'
            });
        }

        // Unblock the user
        user.isActive = true;
        user.blockedAt = null;
        user.blockedBy = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User unblocked successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
