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

// All routes require authentication and infraAdmin or infrastructure role
router.use(protect);
router.use(authorize('infraAdmin', 'infrastructure'));

// @desc    Get Infrastructure dashboard statistics
// @route   GET /api/infra/dashboard
// @access  Private/Infrastructure
router.get('/dashboard', async (req, res) => {
    try {
        // Get fixed resources count
        const totalResources = await Resource.countDocuments({ resourceCategory: 'fixed' });

        // Get bookings assigned to infrastructure
        const totalBookings = await Booking.countDocuments({ assignedDepartment: 'infrastructure' });
        const pendingBookings = await Booking.countDocuments({
            assignedDepartment: 'infrastructure',
            status: { $in: ['pending_hod', 'pending_admin'] }
        });
        const approvedBookings = await Booking.countDocuments({
            assignedDepartment: 'infrastructure',
            status: 'approved'
        });
        const conflictBookings = await Booking.countDocuments({
            assignedDepartment: 'infrastructure',
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

// @desc    Get all bookings for Infrastructure
// @route   GET /api/infra/bookings
// @access  Private/Infrastructure
router.get('/bookings', async (req, res) => {
    try {
        const { status, showConflicts } = req.query;

        let query = { assignedDepartment: 'infrastructure' };

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

// @desc    Get all fixed resources
// @route   GET /api/infra/resources
// @access  Private/Infrastructure
router.get('/resources', async (req, res) => {
    try {
        const resources = await Resource.find({ resourceCategory: 'fixed' })
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

// @desc    Create fixed resource
// @route   POST /api/infra/resources
// @access  Private/Infrastructure
router.post('/resources', async (req, res) => {
    try {
        const resourceData = {
            ...req.body,
            resourceCategory: 'fixed' // Force fixed category
        };

        const resource = await Resource.create(resourceData);

        res.status(201).json({
            success: true,
            data: resource,
            message: 'Fixed resource created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Update fixed resource
// @route   PUT /api/infra/resources/:id
// @access  Private/Infrastructure
router.put('/resources/:id', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        if (resource.resourceCategory !== 'fixed') {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify movable resources from Infrastructure module'
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

// @desc    Delete fixed resource
// @route   DELETE /api/infra/resources/:id
// @access  Private/Infrastructure
router.delete('/resources/:id', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        if (resource.resourceCategory !== 'fixed') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete movable resources from Infrastructure module'
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

// Booking management routes (reuse existing controllers)
router.put('/bookings/:id/approve', approveBookingAdmin);
router.put('/bookings/:id/reject', rejectBookingAdmin);
router.put('/bookings/:id/reschedule', rescheduleBooking);
router.put('/bookings/:id/change-venue', changeVenue);

module.exports = router;
