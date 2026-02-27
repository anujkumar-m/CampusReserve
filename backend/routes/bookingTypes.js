const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const {
    getAllBookingTypes,
    createBookingType,
    updateBookingType,
    deleteBookingType,
} = require('../controllers/bookingTypeController');

// Public — also used in booking form
router.get('/', getAllBookingTypes);

// Admin-only mutations (infraAdmin and itAdmin included)
router.post('/', protect, authorize('admin', 'infraAdmin', 'itAdmin'), createBookingType);
router.put('/:id', protect, authorize('admin', 'infraAdmin', 'itAdmin'), updateBookingType);
router.delete('/:id', protect, authorize('admin', 'infraAdmin', 'itAdmin'), deleteBookingType);

module.exports = router;
