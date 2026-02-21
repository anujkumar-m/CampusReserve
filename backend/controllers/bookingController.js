const Booking = require('../models/Booking');
const Resource = require('../models/Resource');
const User = require('../models/User');
const BookingAuditLog = require('../models/BookingAuditLog');
const { calculateDuration, determineApprovalLevel } = require('../middleware/bookingValidation');
const { canUserApprove } = require('../utils/approvalRouter');
const { doTimeSlotsOverlap } = require('../utils/clashDetection');

/**
 * When a booking is rejected or cancelled, clear the conflictWarning on any
 * other ACTIVE bookings that were previously pointing at it as a conflict.
 * Also re-evaluate whether those siblings still conflict with anything else.
 */
async function clearSiblingConflicts(rejectedOrCancelledBooking) {
    const { resourceId, date, timeSlot, _id } = rejectedOrCancelledBooking;

    // Find all OTHER active bookings on the same resource + date
    const siblings = await Booking.find({
        _id: { $ne: _id },
        resourceId,
        date,
        status: { $in: ['auto_approved', 'pending_hod', 'pending_admin', 'approved'] },
    });

    for (const sibling of siblings) {
        // Only touch siblings whose stored warning pointed at the now-dead booking
        const pointed = sibling.conflictWarning &&
            sibling.conflictWarning.hasConflict &&
            sibling.conflictWarning.conflictingBookingId &&
            sibling.conflictWarning.conflictingBookingId.toString() === _id.toString();

        if (!pointed) continue;

        // Check whether the sibling still conflicts with any remaining active booking
        const stillConflicts = siblings.some(
            (other) =>
                other._id.toString() !== sibling._id.toString() &&
                doTimeSlotsOverlap(sibling.timeSlot, other.timeSlot)
        );

        await Booking.findByIdAndUpdate(sibling._id, {
            $set: {
                'conflictWarning.hasConflict': stillConflicts,
                'conflictWarning.conflictingBookingId': stillConflicts ? sibling.conflictWarning.conflictingBookingId : null,
                'conflictWarning.conflictDetails': stillConflicts ? sibling.conflictWarning.conflictDetails : '',
            },
        });
    }
}

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
    try {
        let query = {};

        // Filter by role
        if (req.user.role === 'infraAdmin' || req.user.role === 'infrastructure') {
            // InfraAdmin sees bookings for fixed resources
            const fixedResources = await Resource.find({ category: { $in: ['department', 'central'] } }).select('_id');
            query.resourceId = { $in: fixedResources.map(r => r._id) };
        } else if (req.user.role === 'itAdmin' || req.user.role === 'itService') {
            // ITAdmin sees bookings for movable resources
            const movableResources = await Resource.find({ category: 'movable_asset' }).select('_id');
            query.resourceId = { $in: movableResources.map(r => r._id) };
        } else if (req.user.role === 'department') {
            query = {
                $or: [
                    { department: req.user.department },
                    { userId: req.user._id }
                ]
            };
        } else if (req.user.role !== 'admin' && req.user.role !== 'infraAdmin' && req.user.role !== 'itAdmin') {
            query.userId = req.user._id;
        }

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by resource
        if (req.query.resourceId) {
            query.resourceId = req.query.resourceId;
        }

        const bookings = await Booking.find(query)
            .populate('resourceId', 'name type location category resourceCategory')
            .populate('userId', 'name email role department')
            .populate('approvedBy', 'name email role')
            .populate('rejectedBy', 'name email role')
            .sort('-createdAt');

        // Filter results for HOD visibility: No movable assets booked by others
        const filteredBookings = bookings.filter(booking => {
            if (!booking.resourceId || !booking.userId) return false;

            // If HOD, exclude movable resources booked by anyone else
            if (req.user.role === 'department' &&
                booking.userId._id.toString() !== req.user._id.toString() &&
                booking.resourceId.resourceCategory === 'movable') {
                return false;
            }
            return true;
        });

        // ── Dynamic conflict re-check ──────────────────────────────────────────
        // For non-admin users we only have their own bookings in filteredBookings,
        // so we can't compute cross-user conflicts on these alone.
        // Instead we query the DB for all other active bookings on the same
        // resource+date and mark a conflict if any time slot overlaps.
        const ACTIVE_STATUSES = ['auto_approved', 'pending_hod', 'pending_admin', 'approved'];
        const isAdminRole = ['admin', 'infraAdmin', 'itAdmin', 'infrastructure', 'itService'].includes(req.user.role);

        let liveConflictMap = {};  // bookingId -> { hasConflict, conflictDetails }

        if (isAdminRole && filteredBookings.length > 0) {
            // Admins can see all bookings — compute live conflicts across the full set
            const activeBookings = filteredBookings.filter(b => ACTIVE_STATUSES.includes(b.status));
            for (const booking of activeBookings) {
                const rid = booking.resourceId._id.toString();
                const peer = activeBookings.find(
                    (other) =>
                        other._id.toString() !== booking._id.toString() &&
                        other.resourceId._id.toString() === rid &&
                        other.date === booking.date &&
                        doTimeSlotsOverlap(booking.timeSlot, other.timeSlot)
                );
                if (peer) {
                    const peerUserName = peer.userId?.name || 'another user';
                    liveConflictMap[booking._id.toString()] = {
                        hasConflict: true,
                        conflictingBookingId: peer._id,
                        conflictDetails: `Conflicts with ${peerUserName}'s booking on ${peer.date} from ${peer.timeSlot.start}–${peer.timeSlot.end}`,
                    };
                }
            }
        } else if (!isAdminRole && filteredBookings.length > 0) {
            // Non-admin: only sees own bookings, so cross-check against all other users' active bookings
            const activeSelf = filteredBookings.filter(b => ACTIVE_STATUSES.includes(b.status));

            if (activeSelf.length > 0) {
                const resourceObjectIds = [...new Map(
                    activeSelf.map(b => [b.resourceId._id.toString(), b.resourceId._id])
                ).values()];
                const dates = [...new Set(activeSelf.map(b => b.date))];

                const allOtherBookings = await Booking.find({
                    resourceId: { $in: resourceObjectIds },
                    date: { $in: dates },
                    status: { $in: ACTIVE_STATUSES },
                    userId: { $ne: req.user._id }
                }).select('resourceId date timeSlot status');

                for (const myBooking of activeSelf) {
                    const myResourceId = myBooking.resourceId._id.toString();
                    const myDate = myBooking.date;
                    for (const other of allOtherBookings) {
                        if (
                            other.resourceId.toString() === myResourceId &&
                            other.date === myDate &&
                            doTimeSlotsOverlap(myBooking.timeSlot, other.timeSlot)
                        ) {
                            liveConflictMap[myBooking._id.toString()] = {
                                hasConflict: true,
                                conflictingBookingId: other._id,
                                conflictDetails: `Conflicts with another booking on ${other.date} from ${other.timeSlot.start}–${other.timeSlot.end}`,
                            };
                            break;
                        }
                    }
                }
            }
        }
        // ── End dynamic conflict re-check ─────────────────────────────────────

        const formattedBookings = filteredBookings.map(booking => ({
            id: booking._id,
            resourceId: booking.resourceId._id,
            resourceName: booking.resourceId.name,
            resourceType: booking.resourceId.type,
            resourceCategory: booking.resourceId.category,
            userId: booking.userId._id,
            userName: booking.userId.name,
            userRole: booking.userId.role,
            userDepartment: booking.userId.department,
            date: booking.date,
            timeSlot: booking.timeSlot,
            duration: booking.duration,
            purpose: booking.purpose,
            bookingType: booking.bookingType,
            status: booking.status,
            requiresApproval: booking.requiresApproval,
            approvalLevel: booking.approvalLevel,
            approvedBy: booking.approvedBy ? {
                id: booking.approvedBy._id,
                name: booking.approvedBy.name,
                role: booking.approvedBy.role
            } : null,
            approvedAt: booking.approvedAt,
            rejectedBy: booking.rejectedBy ? {
                id: booking.rejectedBy._id,
                name: booking.rejectedBy.name,
                role: booking.rejectedBy.role
            } : null,
            rejectedAt: booking.rejectedAt,
            rejectionReason: booking.rejectionReason,
            cancellationReason: booking.cancellationReason,
            // Always use live conflict result. Rejected/cancelled never have conflicts.
            // Never fall back to stale DB-stored conflictWarning.
            conflictWarning: (ACTIVE_STATUSES.includes(booking.status) && liveConflictMap[booking._id.toString()])
                ? liveConflictMap[booking._id.toString()]
                : { hasConflict: false },
            createdAt: booking.createdAt,
            department: booking.department,
        }));

        res.status(200).json({
            success: true,
            count: formattedBookings.length,
            data: formattedBookings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get pending bookings
// @route   GET /api/bookings/pending
// @desc    Get pending bookings
// @route   GET /api/bookings/pending
// @access  Private/Admin/Department
exports.getPendingBookings = async (req, res) => {
    try {
        // We look for 'pending_admin' because we routed everything there.
        // If there are legacy 'pending' or 'pending_hod', we can include them if needed,
        // but strictly adhering to new logic:
        let query = { status: { $in: ['pending_admin', 'pending_hod', 'pending'] } };

        // Department (HOD) usually logic is: only see their dept's pending bookings
        // BUT user said: "Approvals NOT go to HOD", so HOD shouldn't really use this to approve things.
        // However, keeping this for visibility if they want to see "what is pending for my dept members"
        if (req.user.role === 'department') {
            query = {
                status: { $in: ['pending_admin', 'pending_hod', 'pending'] },
                $or: [
                    { department: req.user.department },
                    { userId: req.user._id }
                ]
            };
        }

        // Intra Admin: Sees fixed resources (department and central)
        if (req.user.role === 'infraAdmin' || req.user.role === 'infrastructure') {
            const fixedResources = await Resource.find({ category: { $in: ['department', 'central'] } }).select('_id');
            query.resourceId = { $in: fixedResources.map(r => r._id) };
        }

        // IT Admin: Sees movable resources
        if (req.user.role === 'itAdmin' || req.user.role === 'itService') {
            const movableResources = await Resource.find({ category: 'movable_asset' }).select('_id');
            query.resourceId = { $in: movableResources.map(r => r._id) };
        }

        const bookings = await Booking.find(query)
            .populate('resourceId', 'name type location category')
            .populate('userId', 'name email role department')
            .sort('-createdAt');

        // Filter for HOD: No movable assets booked by others
        const filteredBookings = bookings.filter(booking => {
            if (!booking.resourceId || !booking.userId) return false;
            if (req.user.role === 'department' &&
                booking.userId._id.toString() !== req.user._id.toString() &&
                booking.resourceId.resourceCategory === 'movable') {
                return false;
            }
            return true;
        });

        const formattedBookings = filteredBookings.map(booking => ({
            id: booking._id,
            resourceId: booking.resourceId._id,
            resourceName: booking.resourceId.name,
            resourceCategory: booking.resourceId.category,
            userId: booking.userId._id,
            userName: booking.userId.name,
            userRole: booking.userId.role,
            userDepartment: booking.userId.department,
            date: booking.date,
            timeSlot: booking.timeSlot,
            purpose: booking.purpose,
            status: booking.status,
            conflictWarning: booking.conflictWarning || { hasConflict: false },
            createdAt: booking.createdAt,
            department: booking.department,
        }));

        res.status(200).json({
            success: true,
            count: formattedBookings.length,
            data: formattedBookings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('resourceId', 'name type location')
            .populate('userId', 'name email role');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' &&
            req.user.role !== 'department' &&
            booking.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this booking',
            });
        }

        const formattedBooking = {
            id: booking._id,
            resourceId: booking.resourceId._id,
            resourceName: booking.resourceId.name,
            userId: booking.userId._id,
            userName: booking.userId.name,
            userRole: booking.userId.role,
            date: booking.date,
            timeSlot: booking.timeSlot,
            purpose: booking.purpose,
            status: booking.status,
            createdAt: booking.createdAt,
            department: booking.department,
        };

        res.status(200).json({
            success: true,
            data: formattedBooking,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
    try {
        const { resourceId, date, timeSlot, purpose, bookingType = 'regular' } = req.body;

        // Check if resource exists
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found',
            });
        }

        // Check if resource is available
        if (!resource.isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Resource is not available',
            });
        }

        // Calculate duration
        const duration = calculateDuration(timeSlot);

        // Determine approval level required
        const approvalInfo = determineApprovalLevel(
            req.user.role,
            resource,
            duration
        );

        // ✅ NEW: Determine assigned department based on resource category
        const { checkForConflicts } = require('../utils/clashDetection');
        const { sendHODNotification } = require('../utils/notificationHelper');

        const assignedDepartment = resource.resourceCategory === 'movable' ? 'itService' : 'infrastructure';

        // ✅ NEW: Check for booking conflicts using clash detection utility
        const existingBookings = await Booking.find({
            resourceId,
            date,
            status: { $in: ['auto_approved', 'pending_hod', 'pending_admin', 'approved'] }
        });

        const conflictCheck = checkForConflicts(
            { resourceId, date, timeSlot },
            existingBookings
        );

        // If there's a conflict, still create the booking but mark it with conflict warning
        // The Infrastructure/IT Service dashboard will show the warning and handle resolution

        // Create booking with approval info and new fields
        const booking = await Booking.create({
            resourceId,
            userId: req.user._id,
            date,
            timeSlot,
            duration,
            purpose,
            bookingType,
            department: resource.department || req.user.department,
            status: approvalInfo.status,
            requiresApproval: approvalInfo.requiresApproval,
            approvalLevel: approvalInfo.approvalLevel,
            assignedDepartment, // ✅ NEW: Route to Infrastructure or IT Service
            hodNotified: false, // ✅ NEW: Will be set to true after notification
            conflictWarning: conflictCheck.hasConflict ? {
                hasConflict: true,
                conflictingBookingId: conflictCheck.conflictingBooking?._id,
                conflictDetails: conflictCheck.conflictDetails
            } : {
                hasConflict: false
            }
        });

        // ✅ NEW: Send HOD notification
        if (req.user.department) {
            // Find HOD for the user's department
            const hod = await User.findOne({
                role: 'department',
                department: req.user.department
            });

            if (hod) {
                await sendHODNotification(hod._id, booking._id, {
                    resourceName: resource.name,
                    date: booking.date,
                    timeSlot: booking.timeSlot
                });

                // Mark as HOD notified
                booking.hodNotified = true;
                await booking.save();
            }
        }

        // Create audit log entry
        await BookingAuditLog.create({
            bookingId: booking._id,
            action: 'created',
            performedBy: req.user._id,
            newStatus: approvalInfo.status,
            notes: `Booking created with status: ${approvalInfo.status}. Assigned to ${assignedDepartment}.${conflictCheck.hasConflict ? ' ⚠️ Conflict detected.' : ''}`
        });

        // Populate and format response
        const populatedBooking = await Booking.findById(booking._id)
            .populate('resourceId', 'name type location category resourceCategory')
            .populate('userId', 'name email role department');

        const formattedBooking = {
            id: populatedBooking._id,
            resourceId: populatedBooking.resourceId._id,
            resourceName: populatedBooking.resourceId.name,
            resourceType: populatedBooking.resourceId.type,
            resourceCategory: populatedBooking.resourceId.category,
            userId: populatedBooking.userId._id,
            userName: populatedBooking.userId.name,
            userRole: populatedBooking.userId.role,
            userDepartment: populatedBooking.userId.department,
            date: populatedBooking.date,
            timeSlot: populatedBooking.timeSlot,
            duration: populatedBooking.duration,
            purpose: populatedBooking.purpose,
            bookingType: populatedBooking.bookingType,
            status: populatedBooking.status,
            requiresApproval: populatedBooking.requiresApproval,
            approvalLevel: populatedBooking.approvalLevel,
            assignedDepartment: populatedBooking.assignedDepartment,
            hodNotified: populatedBooking.hodNotified,
            conflictWarning: populatedBooking.conflictWarning,
            createdAt: populatedBooking.createdAt,
            department: populatedBooking.department,
        };

        let message = approvalInfo.requiresApproval
            ? `Booking created. ${approvalInfo.approvalLevel === 'hod' ? 'HOD' : 'Admin'} approval required.`
            : 'Booking auto-approved successfully';

        // ✅ NEW: Add routing and HOD notification info to message
        message += ` Routed to ${assignedDepartment === 'infrastructure' ? 'Infrastructure' : 'IT Service'} department.`;
        if (booking.hodNotified) {
            message += ' Please intimate the respective HOD regarding this booking.';
        }
        if (conflictCheck.hasConflict) {
            message += ' ⚠️ Note: Time slot conflict detected. The booking will be reviewed by the assigned department.';
        }

        res.status(201).json({
            success: true,
            data: formattedBooking,
            message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin/Department
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
            });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // Check authorization
        if (req.user.role === 'department' && booking.department !== req.user.department) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this booking',
            });
        }

        booking.status = status;
        await booking.save();

        const populatedBooking = await Booking.findById(booking._id)
            .populate('resourceId', 'name type location')
            .populate('userId', 'name email role');

        const formattedBooking = {
            id: populatedBooking._id,
            resourceId: populatedBooking.resourceId._id,
            resourceName: populatedBooking.resourceId.name,
            userId: populatedBooking.userId._id,
            userName: populatedBooking.userId.name,
            userRole: populatedBooking.userId.role,
            date: populatedBooking.date,
            timeSlot: populatedBooking.timeSlot,
            purpose: populatedBooking.purpose,
            status: populatedBooking.status,
            createdAt: populatedBooking.createdAt,
            department: populatedBooking.department,
        };

        res.status(200).json({
            success: true,
            data: formattedBooking,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // Check authorization - user can only delete their own bookings, admin can delete any
        if (req.user.role !== 'admin' && booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this booking',
            });
        }

        await Booking.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Booking deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Approve booking
// @route   PUT /api/bookings/:id/approve
// @access  Private/HOD/Admin
exports.approveBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('resourceId', 'name type category')
            .populate('userId', 'name email role department');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // Check if booking is in a pending state
        if (!['pending_hod', 'pending_admin'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: 'Booking is not pending approval',
            });
        }

        // Check authorization using canUserApprove utility
        if (!canUserApprove(req.user, booking)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to approve this booking',
            });
        }

        // Update booking status
        const previousStatus = booking.status;
        booking.status = 'approved';
        booking.approvedBy = req.user._id;
        booking.approvedAt = new Date();
        await booking.save();

        // Create audit log entry
        await BookingAuditLog.create({
            bookingId: booking._id,
            action: 'approved',
            performedBy: req.user._id,
            previousStatus,
            newStatus: 'approved',
            notes: `Approved by ${req.user.role}: ${req.user.name}`
        });

        // Populate approver info
        const updatedBooking = await Booking.findById(booking._id)
            .populate('resourceId', 'name type location category')
            .populate('userId', 'name email role department')
            .populate('approvedBy', 'name email role');

        res.status(200).json({
            success: true,
            message: 'Booking approved successfully',
            data: updatedBooking,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Reject booking
// @route   PUT /api/bookings/:id/reject
// @access  Private/HOD/Admin
exports.rejectBooking = async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Please provide a rejection reason',
            });
        }

        const booking = await Booking.findById(req.params.id)
            .populate('resourceId', 'name type category')
            .populate('userId', 'name email role department');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // Check if booking is in a pending state
        if (!['pending_hod', 'pending_admin'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: 'Booking is not pending approval',
            });
        }

        // Check authorization
        if (!canUserApprove(req.user, booking)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to reject this booking',
            });
        }

        // Update booking status
        const previousStatus = booking.status;
        booking.status = 'rejected';
        booking.rejectedBy = req.user._id;
        booking.rejectedAt = new Date();
        booking.rejectionReason = reason;
        await booking.save();

        // Clear stale conflict warnings on sibling bookings
        await clearSiblingConflicts(booking);

        // Create audit log entry
        await BookingAuditLog.create({
            bookingId: booking._id,
            action: 'rejected',
            performedBy: req.user._id,
            previousStatus,
            newStatus: 'rejected',
            notes: `Rejected by ${req.user.role}: ${req.user.name}. Reason: ${reason}`
        });

        // Populate rejector info
        const updatedBooking = await Booking.findById(booking._id)
            .populate('resourceId', 'name type location category')
            .populate('userId', 'name email role department')
            .populate('rejectedBy', 'name email role');

        res.status(200).json({
            success: true,
            message: 'Booking rejected',
            data: updatedBooking,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // Check authorization - user can cancel their own bookings, admin roles can cancel any
        const isAdminRole = ['admin', 'infraAdmin', 'itAdmin'].includes(req.user.role);
        if (!isAdminRole && booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this booking',
            });
        }

        // Can't cancel already rejected or cancelled bookings
        if (['rejected', 'cancelled'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a booking that is already ${booking.status}`,
            });
        }

        // Update booking status + cancellation reason atomically
        const previousStatus = booking.status;
        const { reason } = req.body;

        const updateFields = { status: 'cancelled' };
        if (reason && reason.trim()) updateFields.cancellationReason = reason.trim();

        await Booking.findByIdAndUpdate(req.params.id, { $set: updateFields });

        // Clear stale conflict warnings on sibling bookings
        await clearSiblingConflicts(booking);

        // Create audit log entry
        await BookingAuditLog.create({
            bookingId: booking._id,
            action: 'cancelled',
            performedBy: req.user._id,
            previousStatus,
            newStatus: 'cancelled',
            notes: reason
                ? `Cancelled by ${req.user.name}: ${reason}`
                : `Cancelled by ${req.user.name}`
        });

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get bookings pending approval
// @route   GET /api/bookings/pending-approval
// @access  Private/HOD/Admin
exports.getBookingsForApproval = async (req, res) => {
    try {
        let query = {};

        // HOD can see pending bookings for their department (Read Only mostly, since they don't approve)
        if (req.user.role === 'department') {
            query = {
                status: { $in: ['pending_hod', 'pending_admin'] },
                $or: [
                    { department: req.user.department },
                    { userId: req.user._id }
                ]
            };
        }
        // InfraAdmin sees fixed resources (department and central)
        else if (req.user.role === 'infraAdmin' || req.user.role === 'infrastructure') {
            const fixedResources = await Resource.find({ category: { $in: ['department', 'central'] } }).select('_id');
            query = {
                status: { $in: ['pending_admin', 'pending_hod'] }, // Catch legacy pending_hod too
                resourceId: { $in: fixedResources.map(r => r._id) }
            };
        }
        // ITAdmin sees movable resources
        else if (req.user.role === 'itAdmin' || req.user.role === 'itService') {
            const movableResources = await Resource.find({ category: 'movable_asset' }).select('_id');
            query = {
                status: { $in: ['pending_admin', 'pending_hod'] }, // Catch legacy pending_hod too
                resourceId: { $in: movableResources.map(r => r._id) }
            };
        }
        else {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view pending approvals',
            });
        }

        const bookings = await Booking.find(query)
            .populate('resourceId', 'name type location category')
            .populate('userId', 'name email role department')
            .sort('-createdAt');

        // Filter for HOD: No movable assets booked by others
        const validBookings = bookings.filter(booking => {
            if (!booking.resourceId || !booking.userId) return false;
            if (req.user.role === 'department' &&
                booking.userId._id.toString() !== req.user._id.toString() &&
                booking.resourceId.resourceCategory === 'movable') {
                return false;
            }
            return true;
        });

        // Live conflict re-check: check each pending booking against ALL other
        // active bookings on the same resource+date (including already-approved ones).
        const liveConflictMapApproval = {};

        if (validBookings.length > 0) {
            // Collect the resource+date pairs we care about
            const resourceObjectIds = [...new Map(
                validBookings.map(b => [b.resourceId._id.toString(), b.resourceId._id])
            ).values()];
            const dates = [...new Set(validBookings.map(b => b.date))];

            // Fetch ALL other active bookings for those resource+date combos
            const pendingIds = validBookings.map(b => b._id.toString());
            const otherActiveBookings = await Booking.find({
                resourceId: { $in: resourceObjectIds },
                date: { $in: dates },
                status: { $in: ['auto_approved', 'pending_hod', 'pending_admin', 'approved'] },
            }).select('resourceId date timeSlot status userId').populate('userId', 'name');

            for (const booking of validBookings) {
                const rid = booking.resourceId._id.toString();
                // Check against all other active bookings (both within this set and external)
                const conflictingOther = otherActiveBookings.find(
                    (other) =>
                        other._id.toString() !== booking._id.toString() &&
                        other.resourceId.toString() === rid &&
                        other.date === booking.date &&
                        doTimeSlotsOverlap(booking.timeSlot, other.timeSlot)
                );
                if (conflictingOther) {
                    const conflictUserName = conflictingOther.userId?.name || 'another user';
                    liveConflictMapApproval[booking._id.toString()] = {
                        hasConflict: true,
                        conflictingBookingId: conflictingOther._id,
                        conflictDetails: `Conflicts with ${conflictUserName}'s booking on ${conflictingOther.date} from ${conflictingOther.timeSlot.start}–${conflictingOther.timeSlot.end}`,
                    };
                }
            }
        }


        const formattedBookings = validBookings.map(booking => ({
            id: booking._id,
            resourceId: booking.resourceId._id,
            resourceName: booking.resourceId.name,
            resourceType: booking.resourceId.type,
            resourceCategory: booking.resourceId.category,
            userId: booking.userId._id,
            userName: booking.userId.name,
            userRole: booking.userId.role,
            userDepartment: booking.userId.department,
            date: booking.date,
            timeSlot: booking.timeSlot,
            duration: booking.duration,
            purpose: booking.purpose,
            bookingType: booking.bookingType,
            status: booking.status,
            approvalLevel: booking.approvalLevel,
            conflictWarning: liveConflictMapApproval[booking._id.toString()] || { hasConflict: false },
            createdAt: booking.createdAt,
            department: booking.department,
        }));

        res.status(200).json({
            success: true,
            count: formattedBookings.length,
            data: formattedBookings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get audit log for booking
// @route   GET /api/bookings/:id/audit
// @access  Private/Admin
exports.getBookingAudit = async (req, res) => {
    try {
        const auditLogs = await BookingAuditLog.find({ bookingId: req.params.id })
            .populate('performedBy', 'name email role')
            .sort('-performedAt');

        res.status(200).json({
            success: true,
            count: auditLogs.length,
            data: auditLogs,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
