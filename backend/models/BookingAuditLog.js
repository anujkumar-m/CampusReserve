const mongoose = require('mongoose');

const bookingAuditLogSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: [true, 'Please specify a booking'],
    },
    action: {
        type: String,
        enum: ['created', 'approved', 'rejected', 'cancelled', 'rescheduled', 'updated', 'deleted', 'deleted_by_admin'],
        required: [true, 'Please specify an action'],
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please specify who performed the action'],
    },
    performedAt: {
        type: Date,
        default: Date.now,
    },
    previousStatus: {
        type: String,
    },
    newStatus: {
        type: String,
    },
    notes: {
        type: String,
        trim: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // For storing additional context
    }
});

// Index for efficient queries
bookingAuditLogSchema.index({ bookingId: 1, performedAt: -1 });
bookingAuditLogSchema.index({ performedBy: 1, performedAt: -1 });

module.exports = mongoose.model('BookingAuditLog', bookingAuditLogSchema);
