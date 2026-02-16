const express = require('express');
const {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    blockUser,
    unblockUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/', authorize('infraAdmin', 'itAdmin'), getUsers);
router.get('/:id', getUser);
router.put('/:id', authorize('admin', 'infraAdmin', 'itAdmin', 'faculty', 'student', 'department', 'club', 'infrastructure', 'itService'), updateUser);
router.put('/:id/block', authorize('infraAdmin', 'itAdmin'), blockUser);
router.put('/:id/unblock', authorize('infraAdmin', 'itAdmin'), unblockUser);
router.delete('/:id', authorize('infraAdmin', 'itAdmin'), deleteUser);

module.exports = router;
