const express = require('express');
const {
    getBookings,
    getPendingBookings,
    getBooking,
    createBooking,
    updateBookingStatus,
    deleteBooking,
    approveBooking,
    rejectBooking,
    cancelBooking,
    getBookingsForApproval,
    getBookingAudit,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validateStudentBooking, validateResourceAccess } = require('../middleware/bookingValidation');

const router = express.Router();

router.use(protect); // All routes require authentication

// Approval-specific routes
router.get('/pending-approval', authorize('infraAdmin', 'itAdmin', 'department'), getBookingsForApproval);
router.get('/pending', authorize('infraAdmin', 'itAdmin', 'department'), getPendingBookings);

// Booking CRUD routes
router
    .route('/')
    .get(getBookings)
    .post(validateStudentBooking, validateResourceAccess, createBooking);

router
    .route('/:id')
    .get(getBooking)
    .delete(deleteBooking);

// Approval actions
router.put('/:id/approve', authorize('infraAdmin', 'itAdmin', 'department'), approveBooking);
router.put('/:id/reject', authorize('infraAdmin', 'itAdmin', 'department'), rejectBooking);
router.put('/:id/cancel', cancelBooking);

// Audit log
router.get('/:id/audit', authorize('infraAdmin', 'itAdmin'), getBookingAudit);

// Admin booking management routes
const {
    rescheduleBooking,
    deleteBookingAdmin,
    approveBookingAdmin,
    rejectBookingAdmin,
    changeVenue
} = require('../controllers/adminBookingController');

router.put('/:id/reschedule', authorize('infraAdmin', 'itAdmin', 'infrastructure', 'itService'), rescheduleBooking);
router.put('/:id/change-venue', authorize('infraAdmin', 'itAdmin', 'infrastructure', 'itService'), changeVenue);
router.delete('/:id/admin', authorize('infraAdmin', 'itAdmin'), deleteBookingAdmin);
router.put('/:id/approve-admin', authorize('infraAdmin', 'itAdmin', 'infrastructure', 'itService'), approveBookingAdmin);
router.put('/:id/reject-admin', authorize('infraAdmin', 'itAdmin', 'infrastructure', 'itService'), rejectBookingAdmin);

// Legacy status update (keep for backward compatibility)
router.put('/:id/status', authorize('infraAdmin', 'itAdmin', 'department'), updateBookingStatus);

module.exports = router;
