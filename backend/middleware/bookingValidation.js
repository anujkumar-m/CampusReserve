const Booking = require('../models/Booking');
const Resource = require('../models/Resource');

/**
 * Calculate duration in hours from timeSlot
 */
const calculateDuration = (timeSlot) => {
    const [startHour, startMin] = timeSlot.start.split(':').map(Number);
    const [endHour, endMin] = timeSlot.end.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    const durationMinutes = endMinutes - startMinutes;
    return durationMinutes / 60; // Convert to hours
};

/**
 * Check if student has already booked for the given date
 */
const checkDailyLimit = async (userId, date, excludeBookingId = null) => {
    const query = {
        userId,
        date,
        status: { $in: ['auto_approved', 'pending_hod', 'pending_admin', 'approved'] }
    };

    // Exclude current booking if updating
    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const existingBooking = await Booking.findOne(query);
    return existingBooking !== null;
};

/**
 * Validate student booking restrictions
 */
const validateStudentBooking = async (req, res, next) => {
    if (req.user.role !== 'student') {
        return next();
    }

    const { date } = req.body;

    // Check daily booking limit (1 booking per day)
    const hasBookingToday = await checkDailyLimit(req.user._id, date);
    if (hasBookingToday) {
        return res.status(400).json({
            success: false,
            message: 'You already have a booking for this date. Students can only make one booking per day.'
        });
    }

    // Duration validation is handled by determineApprovalLevel
    // Bookings > 1 hour will require HOD approval (pending_hod status)
    next();
};

/**
 * Validate resource access based on user role
 */
const validateResourceAccess = async (req, res, next) => {
    const { resourceId } = req.body;
    const resource = await Resource.findById(resourceId);

    if (!resource) {
        return res.status(404).json({
            success: false,
            message: 'Resource not found'
        });
    }

    const userRole = req.user.role;
    const isMovable = resource.isMovable || resource.category === 'movable_asset';

    // CRITICAL RULE: Students CANNOT book movable resources under any condition
    if (userRole === 'student' && isMovable) {
        return res.status(403).json({
            success: false,
            message: 'Students are not allowed to book movable resources (projectors, speakers, cameras, etc.). Please contact your department for assistance.'
        });
    }

    // Admin can access all resources
    if (userRole === 'admin') {
        req.resource = resource;
        return next();
    }

    // Student restrictions for non-movable resources
    if (userRole === 'student') {
        const resourceCategory = resource.category;

        if (resourceCategory !== 'department') {
            return res.status(403).json({
                success: false,
                message: 'Students can only book department-level resources'
            });
        }

        // Check department match
        if (resource.department !== req.user.department) {
            return res.status(403).json({
                success: false,
                message: 'Students can only book resources from their own department'
            });
        }
    }

    req.resource = resource;
    next()
};

// Determine approval level required for booking
// CORE LOGIC:
// - Student + movable → REJECTED (handled in validateResourceAccess)
// - All approvals go to ADMIN (Infra or IT based on resource type)
// - HOD notification is sent, but HOD approval is NOT required in the system flow
const determineApprovalLevel = (userRole, resource, duration) => {
    const isMovable = resource.isMovable || resource.category === 'movable_asset';
    const resourceCategory = resource.category;

    // Admin never needs approval
    if (userRole === 'admin') {
        return {
            requiresApproval: false,
            approvalLevel: 'none',
            status: 'auto_approved'
        };
    }

    // All movable resources require ADMIN (IT Admin) approval
    if (isMovable) {
        return {
            requiresApproval: true,
            approvalLevel: 'admin',
            status: 'pending_admin'
        };
    }

    // Student bookings (non-movable)
    if (userRole === 'student') {
        if (duration <= 1) {
            // Auto-approve if ≤1 hour
            return {
                requiresApproval: false,
                approvalLevel: 'none',
                status: 'auto_approved'
            };
        } else {
            // Require ADMIN approval if >1 hour (Removed HOD approval step)
            return {
                requiresApproval: true,
                approvalLevel: 'admin',
                status: 'pending_admin'
            };
        }
    }

    // Faculty bookings (non-movable)
    if (userRole === 'faculty') {
        if (duration > 1) {
            // Duration >1 hour requires ADMIN approval (Removed HOD approval step)
            return {
                requiresApproval: true,
                approvalLevel: 'admin',
                status: 'pending_admin'
            };
        } else if (resourceCategory === 'central') {
            // Central resources need admin approval
            return {
                requiresApproval: true,
                approvalLevel: 'admin',
                status: 'pending_admin'
            };
        } else {
            // Department resources ≤1 hour auto-approve
            return {
                requiresApproval: false,
                approvalLevel: 'none',
                status: 'auto_approved'
            };
        }
    }

    // HOD bookings (non-movable)
    if (userRole === 'department') {
        // HOD bookings now require ADMIN approval (No auto-approval)
        return {
            requiresApproval: true,
            approvalLevel: 'admin',
            status: 'pending_admin'
        };
    }

    // Club bookings (non-movable)
    if (userRole === 'club') {
        return {
            requiresApproval: true,
            approvalLevel: 'admin',
            status: 'pending_admin'
        };
    }

    // Default: require admin approval
    return {
        requiresApproval: true,
        approvalLevel: 'admin',
        status: 'pending_admin'
    };
};

module.exports = {
    calculateDuration,
    checkDailyLimit,
    validateStudentBooking,
    validateResourceAccess,
    determineApprovalLevel
};
