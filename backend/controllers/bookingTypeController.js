const BookingType = require('../models/BookingType');
const Booking = require('../models/Booking');

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// @desc    Get all booking types (sorted by priority: high → medium → low)
// @route   GET /api/booking-types
// @access  Public (used in booking form too)
const getAllBookingTypes = async (req, res) => {
    try {
        const bookingTypes = await BookingType.find().sort({ name: 1 });
        // Sort in-memory by priority weight
        bookingTypes.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3));
        res.status(200).json({ success: true, data: bookingTypes });
    } catch (error) {
        console.error('getAllBookingTypes error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching booking types' });
    }
};

// @desc    Create a new booking type
// @route   POST /api/booking-types
// @access  Admin only
const createBookingType = async (req, res) => {
    try {
        const { name, value, description, priority, isActive } = req.body;

        if (!name || !value) {
            return res.status(400).json({ success: false, message: 'Name and value are required' });
        }

        const bookingType = await BookingType.create({
            name: name.trim(),
            value: value.trim().toLowerCase().replace(/\s+/g, '_'),
            description: description?.trim() || '',
            priority: priority || 'medium',
            isActive: isActive !== undefined ? isActive : true,
        });

        res.status(201).json({ success: true, data: bookingType, message: 'Booking type created successfully' });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ success: false, message: `A booking type with this ${field} already exists` });
        }
        console.error('createBookingType error:', error);
        res.status(500).json({ success: false, message: 'Server error creating booking type' });
    }
};

// @desc    Update a booking type
// @route   PUT /api/booking-types/:id
// @access  Admin only
const updateBookingType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, value, description, priority, isActive } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (value !== undefined) updateData.value = value.trim().toLowerCase().replace(/\s+/g, '_');
        if (description !== undefined) updateData.description = description.trim();
        if (priority !== undefined) updateData.priority = priority;
        if (isActive !== undefined) updateData.isActive = isActive;

        const bookingType = await BookingType.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!bookingType) {
            return res.status(404).json({ success: false, message: 'Booking type not found' });
        }

        res.status(200).json({ success: true, data: bookingType, message: 'Booking type updated successfully' });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ success: false, message: `A booking type with this ${field} already exists` });
        }
        console.error('updateBookingType error:', error);
        res.status(500).json({ success: false, message: 'Server error updating booking type' });
    }
};

// @desc    Delete a booking type
// @route   DELETE /api/booking-types/:id
// @access  Admin only
const deleteBookingType = async (req, res) => {
    try {
        const { id } = req.params;

        const bookingType = await BookingType.findById(id);
        if (!bookingType) {
            return res.status(404).json({ success: false, message: 'Booking type not found' });
        }

        // Check if this booking type is used in existing bookings
        const usageCount = await Booking.countDocuments({ bookingType: bookingType.value });
        if (usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete: this booking type is used in ${usageCount} existing booking(s). Deactivate it instead.`,
            });
        }

        await BookingType.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Booking type deleted successfully' });
    } catch (error) {
        console.error('deleteBookingType error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting booking type' });
    }
};

// @desc    Bulk reorder priorities
// @route   PATCH /api/booking-types/reorder
// @access  Admin only
// @body    { items: [{id, priority}] }
const reorderPriority = async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'items array is required' });
        }

        const bulkOps = items.map(({ id, priority }) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { priority: Number(priority) } },
            },
        }));

        await BookingType.bulkWrite(bulkOps);

        const updated = await BookingType.find().sort({ priority: 1, name: 1 });
        res.status(200).json({ success: true, data: updated, message: 'Priorities updated successfully' });
    } catch (error) {
        console.error('reorderPriority error:', error);
        res.status(500).json({ success: false, message: 'Server error reordering priorities' });
    }
};

module.exports = {
    getAllBookingTypes,
    createBookingType,
    updateBookingType,
    deleteBookingType,
};
