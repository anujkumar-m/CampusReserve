const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const Booking = require('../models/Booking');
const Resource = require('../models/Resource');
const {
    rescheduleBooking,
    approveBookingAdmin,
    rejectBookingAdmin,
    changeVenue
} = require('../controllers/adminBookingController');

// All routes require authentication and itAdmin or itService role
router.use(protect);
router.use(authorize('itAdmin', 'itService'));

// @desc    Get IT Service dashboard statistics
// @route   GET /api/it/dashboard
// @access  Private/IT Service
router.get('/dashboard', async (req, res) => {
    try {
        // Get movable resources count
        const totalResources = await Resource.countDocuments({ resourceCategory: 'movable' });

        // Get bookings assigned to IT Service
        const totalBookings = await Booking.countDocuments({ assignedDepartment: 'itService' });
        const pendingBookings = await Booking.countDocuments({
            assignedDepartment: 'itService',
            status: { $in: ['pending_hod', 'pending_admin'] }
        });
        const approvedBookings = await Booking.countDocuments({
            assignedDepartment: 'itService',
            status: 'approved'
        });
        const conflictBookings = await Booking.countDocuments({
            assignedDepartment: 'itService',
            'conflictWarning.hasConflict': true,
            status: { $in: ['pending_hod', 'pending_admin', 'approved'] }
        });

        res.status(200).json({
            success: true,
            data: {
                totalResources,
                totalBookings,
                pendingBookings,
                approvedBookings,
                conflictBookings
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Get all bookings for IT Service
// @route   GET /api/it/bookings
// @access  Private/IT Service
router.get('/bookings', async (req, res) => {
    try {
        const { status, showConflicts } = req.query;

        let query = { assignedDepartment: 'itService' };

        if (status) {
            query.status = status;
        }

        if (showConflicts === 'true') {
            query['conflictWarning.hasConflict'] = true;
        }

        const bookings = await Booking.find(query)
            .populate('resourceId', 'name type location category resourceCategory')
            .populate('userId', 'name email role department')
            .populate('approvedBy', 'name role')
            .populate('rejectedBy', 'name role')
            .populate('conflictWarning.conflictingBookingId')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Get all movable resources
// @route   GET /api/it/resources
// @access  Private/IT Service
router.get('/resources', async (req, res) => {
    try {
        const resources = await Resource.find({ resourceCategory: 'movable' })
            .sort('name');

        res.status(200).json({
            success: true,
            count: resources.length,
            data: resources
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Create movable resource
// @route   POST /api/it/resources
// @access  Private/IT Service
router.post('/resources', async (req, res) => {
    try {
        const resourceData = {
            ...req.body,
            resourceCategory: 'movable' // Force movable category
        };

        const resource = await Resource.create(resourceData);

        res.status(201).json({
            success: true,
            data: resource,
            message: 'Movable resource created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Update movable resource
// @route   PUT /api/it/resources/:id
// @access  Private/IT Service
router.put('/resources/:id', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        if (resource.resourceCategory !== 'movable') {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify fixed resources from IT Service module'
            });
        }

        const updatedResource = await Resource.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedResource,
            message: 'Resource updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Delete movable resource
// @route   DELETE /api/it/resources/:id
// @access  Private/IT Service
router.delete('/resources/:id', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        if (resource.resourceCategory !== 'movable') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete fixed resources from IT Service module'
            });
        }

        await Resource.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Resource deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Allocate movable resource (specific to IT Service)
// @route   PUT /api/it/bookings/:id/allocate
// @access  Private/IT Service
router.put('/bookings/:id/allocate', async (req, res) => {
    try {
        const { allocated } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.assignedDepartment !== 'itService') {
            return res.status(403).json({
                success: false,
                message: 'This booking is not assigned to IT Service'
            });
        }

        // You can add allocation tracking logic here
        // For now, we'll just approve the booking
        booking.status = allocated ? 'approved' : booking.status;
        booking.approvedBy = allocated ? req.user._id : booking.approvedBy;
        booking.approvedAt = allocated ? new Date() : booking.approvedAt;
        await booking.save();

        res.status(200).json({
            success: true,
            data: booking,
            message: allocated ? 'Resource allocated successfully' : 'Allocation removed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Booking management routes (reuse existing controllers)
router.put('/bookings/:id/approve', approveBookingAdmin);
router.put('/bookings/:id/reject', rejectBookingAdmin);
router.put('/bookings/:id/reschedule', rescheduleBooking);
router.put('/bookings/:id/change-venue', changeVenue);

module.exports = router;
