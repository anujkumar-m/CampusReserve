const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
        required: [true, 'Please specify a resource'],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please specify a user'],
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: [true, 'Please provide a date'],
    },
    timeSlot: {
        start: {
            type: String, // Format: HH:MM
            required: [true, 'Please provide start time'],
        },
        end: {
            type: String, // Format: HH:MM
            required: [true, 'Please provide end time'],
        },
    },
    purpose: {
        type: String,
        required: [true, 'Please provide booking purpose'],
        trim: true,
    },
    bookingType: {
        type: String,
        enum: ['regular', 'remedial', 'project', 'event', 'industrial_visit', 'other'],
        default: 'regular'
    },
    duration: {
        type: Number, // in hours
        required: true
    },
    status: {
        type: String,
        enum: ['auto_approved', 'pending_hod', 'pending_admin', 'approved', 'rejected', 'cancelled'],
        default: 'pending_hod',
    },
    requiresApproval: {
        type: Boolean,
        default: true
    },
    approvalLevel: {
        type: String,
        enum: ['none', 'hod', 'admin'],
        default: 'none'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    department: {
        type: String,
    },
    assignedDepartment: {
        type: String,
        enum: ['infrastructure', 'itService'],
        required: [true, 'Booking must be assigned to Infrastructure or IT Service']
    },
    hodNotified: {
        type: Boolean,
        default: false
    },
    conflictWarning: {
        hasConflict: {
            type: Boolean,
            default: false
        },
        conflictingBookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking'
        },
        conflictDetails: {
            type: String
        }
    },
    venueChanged: {
        type: Boolean,
        default: false
    },
    originalVenue: {
        type: String
    },
    venueChangeReason: {
        type: String,
        trim: true
    },
    rescheduledFrom: {
        date: String,
        timeSlot: {
            start: String,
            end: String
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for efficient queries
bookingSchema.index({ resourceId: 1, date: 1, status: 1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ status: 1, approvalLevel: 1, department: 1 }); // For approval queries
bookingSchema.index({ date: 1, userId: 1 }); // For daily limit checks

// Virtual fields for populated data
bookingSchema.virtual('resourceName');
bookingSchema.virtual('userName');
bookingSchema.virtual('userRole');

// Ensure virtuals are included in JSON
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);
