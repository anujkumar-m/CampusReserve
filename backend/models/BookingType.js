const mongoose = require('mongoose');

const bookingTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Booking type name is required'],
        trim: true,
        unique: true,
    },
    value: {
        type: String,
        required: [true, 'Booking type value (key) is required'],
        trim: true,
        unique: true,
        lowercase: true,
        match: [/^[a-z0-9_]+$/, 'Value must only contain lowercase letters, numbers, and underscores'],
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

bookingTypeSchema.index({ priority: 1 });

module.exports = mongoose.model('BookingType', bookingTypeSchema);
