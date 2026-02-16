/**
 * Utility functions for approval routing logic
 */

/**
 * Get required approver level based on user role and resource
 */
const getRequiredApprover = (userRole, resourceCategory, duration) => {
    // InfraAdmin and ItAdmin never need approval
    if (userRole === 'infraAdmin' || userRole === 'itAdmin') {
        return 'none';
    }

    // Club always needs admin approval
    if (userRole === 'club') {
        return 'admin';
    }

    // Student: auto-approve ≤1 hour, HOD approval >1 hour
    if (userRole === 'student') {
        return duration <= 1 ? 'none' : 'hod';
    }

    // Faculty: HOD for department, admin for central
    if (userRole === 'faculty') {
        return resourceCategory === 'department' ? 'hod' : 'admin';
    }

    // HOD: auto-approve department, admin for central
    if (userRole === 'department') {
        return resourceCategory === 'department' ? 'none' : 'admin';
    }

    return 'admin'; // Default
};

/**
 * Check if user can approve a booking
 */
const canUserApprove = (user, booking) => {
    // InfraAdmin and ItAdmin can approve everything
    if (user.role === 'infraAdmin' || user.role === 'itAdmin') {
        return true;
    }

    // HOD can approve department-level bookings for their department
    if (user.role === 'department') {
        return booking.approvalLevel === 'hod' &&
            booking.department === user.department;
    }

    return false;
};

/**
 * Get approval status message for user
 */
const getApprovalMessage = (requiresApproval, approvalLevel) => {
    if (!requiresApproval) {
        return 'This booking will be auto-approved';
    }

    if (approvalLevel === 'hod') {
        return 'This booking requires HOD approval';
    }

    if (approvalLevel === 'admin') {
        return 'This booking requires Admin approval';
    }

    return 'This booking requires approval';
};

module.exports = {
    getRequiredApprover,
    canUserApprove,
    getApprovalMessage
};
