const Notification = require('../models/Notification');

/**
 * Notification Helper Utility
 * Creates and manages notifications for users
 */

/**
 * Send HOD notification when a booking is created
 * @param {ObjectId} hodId - HOD user ID
 * @param {ObjectId} bookingId - Booking ID
 * @param {Object} bookingDetails - Booking details for message
 */
const sendHODNotification = async (hodId, bookingId, bookingDetails) => {
    try {
        const message = `New booking request: ${bookingDetails.resourceName} on ${bookingDetails.date} from ${bookingDetails.timeSlot.start} to ${bookingDetails.timeSlot.end}. Please intimate the respective department.`;

        const notification = await Notification.create({
            recipient: hodId,
            message,
            bookingId,
            type: 'hodNotification'
        });

        return notification;
    } catch (error) {
        console.error('Error sending HOD notification:', error);
        throw error;
    }
};

/**
 * Send venue change notification to requester
 * @param {ObjectId} userId - User ID who made the booking
 * @param {ObjectId} bookingId - Booking ID
 * @param {String} originalVenue - Original venue name
 * @param {String} newVenue - New venue name
 * @param {String} reason - Reason for venue change
 */
const sendVenueChangeNotification = async (userId, bookingId, originalVenue, newVenue, reason) => {
    try {
        const message = `Your venue has been changed from "${originalVenue}" to "${newVenue}" ${reason ? `due to ${reason}` : 'due to scheduling conflict'}.`;

        const notification = await Notification.create({
            recipient: userId,
            message,
            bookingId,
            type: 'venueChange'
        });

        return notification;
    } catch (error) {
        console.error('Error sending venue change notification:', error);
        throw error;
    }
};

/**
 * Send reschedule notification to requester
 * @param {ObjectId} userId - User ID who made the booking
 * @param {ObjectId} bookingId - Booking ID
 * @param {Object} oldSchedule - Original schedule {date, timeSlot}
 * @param {Object} newSchedule - New schedule {date, timeSlot}
 * @param {String} reason - Reason for reschedule
 */
const sendRescheduleNotification = async (userId, bookingId, oldSchedule, newSchedule, reason) => {
    try {
        const message = `Your booking has been rescheduled from ${oldSchedule.date} (${oldSchedule.timeSlot.start}-${oldSchedule.timeSlot.end}) to ${newSchedule.date} (${newSchedule.timeSlot.start}-${newSchedule.timeSlot.end})${reason ? `. Reason: ${reason}` : ''}.`;

        const notification = await Notification.create({
            recipient: userId,
            message,
            bookingId,
            type: 'reschedule'
        });

        return notification;
    } catch (error) {
        console.error('Error sending reschedule notification:', error);
        throw error;
    }
};

/**
 * Send approval notification to requester
 * @param {ObjectId} userId - User ID who made the booking
 * @param {ObjectId} bookingId - Booking ID
 * @param {Object} bookingDetails - Booking details
 */
const sendApprovalNotification = async (userId, bookingId, bookingDetails) => {
    try {
        const message = `Your booking for ${bookingDetails.resourceName} on ${bookingDetails.date} from ${bookingDetails.timeSlot.start} to ${bookingDetails.timeSlot.end} has been approved.`;

        const notification = await Notification.create({
            recipient: userId,
            message,
            bookingId,
            type: 'approval'
        });

        return notification;
    } catch (error) {
        console.error('Error sending approval notification:', error);
        throw error;
    }
};

/**
 * Send rejection notification to requester
 * @param {ObjectId} userId - User ID who made the booking
 * @param {ObjectId} bookingId - Booking ID
 * @param {Object} bookingDetails - Booking details
 * @param {String} reason - Rejection reason
 */
const sendRejectionNotification = async (userId, bookingId, bookingDetails, reason) => {
    try {
        const message = `Your booking for ${bookingDetails.resourceName} on ${bookingDetails.date} from ${bookingDetails.timeSlot.start} to ${bookingDetails.timeSlot.end} has been rejected${reason ? `. Reason: ${reason}` : ''}.`;

        const notification = await Notification.create({
            recipient: userId,
            message,
            bookingId,
            type: 'rejection'
        });

        return notification;
    } catch (error) {
        console.error('Error sending rejection notification:', error);
        throw error;
    }
};

module.exports = {
    sendHODNotification,
    sendVenueChangeNotification,
    sendRescheduleNotification,
    sendApprovalNotification,
    sendRejectionNotification
};
