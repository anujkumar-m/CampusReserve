const Booking = require('../models/Booking');
const Resource = require('../models/Resource');
const User = require('../models/User');
const BookingAuditLog = require('../models/BookingAuditLog');
const { calculateDuration } = require('../middleware/bookingValidation');
const { doTimeSlotsOverlap } = require('../utils/clashDetection');
const { sendRescheduleNotification, sendApprovalNotification, sendRejectionNotification, sendVenueChangeNotification } = require('../utils/notificationHelper');

/**
 * Clear stale conflictWarning on active siblings after a booking is rejected/cancelled.
 */
async function clearSiblingConflicts(rejectedOrCancelledBooking) {
    const { resourceId, date, _id } = rejectedOrCancelledBooking;
    const siblings = await Booking.find({
        _id: { $ne: _id },
        resourceId,
        date,
        status: { $in: ['auto_approved', 'pending_hod', 'pending_admin', 'approved'] },
    });
    for (const sibling of siblings) {
        const pointed = sibling.conflictWarning &&
            sibling.conflictWarning.hasConflict &&
            sibling.conflictWarning.conflictingBookingId &&
            sibling.conflictWarning.conflictingBookingId.toString() === _id.toString();
        if (!pointed) continue;
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

// @desc    Reschedule booking (Admin only)
// @route   PUT /api/bookings/:id/reschedule
// @access  Private/Admin
exports.rescheduleBooking = async (req, res) => {
    try {
        const { date, timeSlot, reason } = req.body;
        const bookingId = req.params.id;

        // Find the booking
        const booking = await Booking.findById(bookingId)
            .populate('resourceId', 'name type')
            .populate('userId', 'name email');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Store original schedule for notification
        const oldSchedule = {
            date: booking.date,
            timeSlot: { ...booking.timeSlot }
        };

        // Calculate new duration
        const duration = calculateDuration(timeSlot);

        // Check for conflicts with the new time slot
        const conflictingBooking = await Booking.findOne({
            resourceId: booking.resourceId._id,
            date,
            _id: { $ne: bookingId }, // Exclude current booking
            status: { $in: ['auto_approved', 'pending_hod', 'pending_admin', 'approved'] },
            $or: [
                {
                    'timeSlot.start': { $lt: timeSlot.end },
                    'timeSlot.end': { $gt: timeSlot.start },
                },
            ],
        });

        if (conflictingBooking) {
            return res.status(400).json({
                success: false,
                message: 'Time slot conflicts with an existing booking'
            });
        }

        // Update booking with rescheduled info
        booking.rescheduledFrom = oldSchedule;
        booking.date = date;
        booking.timeSlot = timeSlot;
        booking.duration = duration;
        await booking.save();

        // ✅ Send reschedule notification to user
        await sendRescheduleNotification(
            booking.userId._id,
            booking._id,
            oldSchedule,
            { date, timeSlot },
            reason
        );

        // Create audit log
        await BookingAuditLog.create({
            bookingId: booking._id,
            action: 'rescheduled',
            performedBy: req.user._id,
            notes: reason || `Rescheduled to ${date} ${timeSlot.start}-${timeSlot.end}`
        });

        res.status(200).json({
            success: true,
            message: 'Booking rescheduled successfully. User has been notified.',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete booking (Admin only)
// @route   DELETE /api/bookings/:id/admin
// @access  Private/Admin
exports.deleteBookingAdmin = async (req, res) => {
    try {
        const { reason } = req.body;
        const bookingId = req.params.id;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Create audit log before deletion
        await BookingAuditLog.create({
            bookingId: booking._id,
            action: 'deleted_by_admin',
            performedBy: req.user._id,
            notes: reason || 'Deleted by admin'
        });

        // Delete the booking
        await Booking.findByIdAndDelete(bookingId);

        res.status(200).json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Approve booking (Admin override)
// @route   PUT /api/bookings/:id/approve-admin
// @access  Private/Admin
exports.approveBookingAdmin = async (req, res) => {
    try {
        const bookingId = req.params.id;

        const booking = await Booking.findById(bookingId)
            .populate('resourceId', 'name type')
            .populate('userId', 'name email');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const previousStatus = booking.status;

        // Update booking status
        booking.status = 'approved';
        booking.approvedBy = req.user._id;
        booking.approvedAt = new Date();
        await booking.save();

        // ✅ Send approval notification to user
        await sendApprovalNotification(
            booking.userId._id,
            booking._id,
            {
                resourceName: booking.resourceId.name,
                date: booking.date,
                timeSlot: booking.timeSlot
            }
        );

        // Create audit log
        await BookingAuditLog.create({
            bookingId: booking._id,
            action: 'approved',
            performedBy: req.user._id,
            previousStatus,
            newStatus: 'approved',
            notes: 'Approved by admin override'
        });

        res.status(200).json({
            success: true,
            message: 'Booking approved successfully. User has been notified.',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Reject booking (Admin override)
// @route   PUT /api/bookings/:id/reject-admin
// @access  Private/Admin
exports.rejectBookingAdmin = async (req, res) => {
    try {
        const { reason } = req.body;
        const bookingId = req.params.id;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason for rejection'
            });
        }

        const booking = await Booking.findById(bookingId)
            .populate('resourceId', 'name type')
            .populate('userId', 'name email');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const previousStatus = booking.status;

        // Update booking status
        booking.status = 'rejected';
        booking.rejectedBy = req.user._id;
        booking.rejectedAt = new Date();
        booking.rejectionReason = reason;
        await booking.save();

        // Clear stale conflict warnings on sibling bookings
        await clearSiblingConflicts(booking);

        // ✅ Send rejection notification to user
        await sendRejectionNotification(
            booking.userId._id,
            booking._id,
            {
                resourceName: booking.resourceId.name,
                date: booking.date,
                timeSlot: booking.timeSlot
            },
            reason
        );

        // Create audit log
        await BookingAuditLog.create({
            bookingId: booking._id,
            action: 'rejected',
            performedBy: req.user._id,
            previousStatus,
            newStatus: 'rejected',
            notes: reason
        });

        res.status(200).json({
            success: true,
            message: 'Booking rejected successfully. User has been notified.',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Change venue for booking (Admin/Infrastructure/IT Service)
// @route   PUT /api/bookings/:id/change-venue
// @access  Private/Admin/Infrastructure/IT Service
exports.changeVenue = async (req, res) => {
    try {
        const { newResourceId, reason } = req.body;
        const bookingId = req.params.id;

        if (!newResourceId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a new resource ID'
            });
        }

        // Find the booking
        const booking = await Booking.findById(bookingId)
            .populate('resourceId', 'name type')
            .populate('userId', 'name email');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Find the new resource
        const newResource = await Resource.findById(newResourceId);

        if (!newResource) {
            return res.status(404).json({
                success: false,
                message: 'New resource not found'
            });
        }

        // Check if new resource is available
        if (!newResource.isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'New resource is not available'
            });
        }

        // Check for conflicts with the new resource
        const conflictingBooking = await Booking.findOne({
            resourceId: newResourceId,
            date: booking.date,
            _id: { $ne: bookingId },
            status: { $in: ['auto_approved', 'pending_hod', 'pending_admin', 'approved'] },
            $or: [
                {
                    'timeSlot.start': { $lt: booking.timeSlot.end },
                    'timeSlot.end': { $gt: booking.timeSlot.start },
                },
            ],
        });

        if (conflictingBooking) {
            return res.status(400).json({
                success: false,
                message: 'Time slot conflicts with an existing booking for the new resource'
            });
        }

        // Store original venue
        const originalVenueName = booking.resourceId.name;
        booking.originalVenue = originalVenueName;
        booking.venueChanged = true;
        booking.venueChangeReason = reason || 'Venue changed due to scheduling conflict';
        booking.resourceId = newResourceId;
        await booking.save();

        // ✅ Send venue change notification to user
        await sendVenueChangeNotification(
            booking.userId._id,
            booking._id,
            originalVenueName,
            newResource.name,
            reason
        );

        // Create audit log
        await BookingAuditLog.create({
            bookingId: booking._id,
            action: 'venue_changed',
            performedBy: req.user._id,
            notes: `Venue changed from ${originalVenueName} to ${newResource.name}. ${reason || 'No reason provided'}`
        });

        // Populate and return updated booking
        const updatedBooking = await Booking.findById(bookingId)
            .populate('resourceId', 'name type location')
            .populate('userId', 'name email');

        res.status(200).json({
            success: true,
            message: 'Venue changed successfully. User has been notified.',
            data: updatedBooking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = exports;
