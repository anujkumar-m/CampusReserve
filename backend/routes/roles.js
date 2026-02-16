const express = require('express');
const { assignRole, getPendingRoles } = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.post('/assign', protect, authorize('infraAdmin', 'itAdmin'), assignRole);
router.get('/pending', protect, authorize('infraAdmin', 'itAdmin'), getPendingRoles);

module.exports = router;
