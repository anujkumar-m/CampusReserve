const express = require('express');
const {
    getResources,
    getResource,
    createResource,
    updateResource,
    deleteResource,
} = require('../controllers/resourceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect); // All routes require authentication

router
    .route('/')
    .get(getResources)
    .post(authorize('infraAdmin', 'itAdmin', 'department'), createResource);

router
    .route('/:id')
    .get(getResource)
    .put(authorize('infraAdmin', 'itAdmin', 'department'), updateResource)
    .delete(authorize('infraAdmin', 'itAdmin'), deleteResource);

module.exports = router;
