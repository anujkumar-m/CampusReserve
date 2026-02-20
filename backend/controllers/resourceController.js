const Resource = require('../models/Resource');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
exports.getResources = async (req, res) => {
    try {
        let query = {};

        // Role-based filtering
        const userRole = req.user.role;
        const userDepartment = req.user.department;

        if (userRole === 'student') {
            // Students can see ALL department-level resources (but can only book from their own dept)
            query.category = 'department';
            // Removed department filter - students can browse all department resources
            // Booking validation will still restrict them to their own department
            query.type = { $in: ['department_library', 'classroom', 'lab', 'department_seminar_hall'] };
            // Only show available labs to students
            query.$or = [
                { type: { $ne: 'lab' } },
                { type: 'lab', isAvailable: true }
            ];
        } else if (userRole === 'faculty') {
            // Faculty can see department, central, and movable resources
            query.category = { $in: ['department', 'central', 'movable_asset'] };
        } else if (userRole === 'department') {
            // HOD can see all department resources + central resources + movable assets
            query.$or = [
                { category: 'department' },
                { category: 'central' },
                { category: 'movable_asset' }
            ];
        } else if (userRole === 'infraAdmin' || userRole === 'infrastructure') {
            // Infra Admin sees ONLY fixed resources (department and central)
            query.category = { $in: ['department', 'central'] };
        } else if (userRole === 'itAdmin' || userRole === 'itService') {
            // IT Admin sees ONLY movable resources
            query.category = 'movable_asset';
        }

        // Additional filters from query params
        if (req.query.type) {
            query.type = req.query.type;
        }

        if (req.query.department) {
            query.department = req.query.department;
        }

        if (req.query.category) {
            query.category = req.query.category;
        }

        if (req.query.isAvailable !== undefined) {
            query.isAvailable = req.query.isAvailable === 'true';
        }

        const resources = await Resource.find(query);

        res.status(200).json({
            success: true,
            count: resources.length,
            data: resources,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
exports.getResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found',
            });
        }

        res.status(200).json({
            success: true,
            data: resource,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private/Admin/Department
exports.createResource = async (req, res) => {
    try {
        const resource = await Resource.create(req.body);

        res.status(201).json({
            success: true,
            data: resource,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private/Admin/Department
exports.updateResource = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found',
            });
        }

        res.status(200).json({
            success: true,
            data: resource,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private/Admin
exports.deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndDelete(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Resource deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
