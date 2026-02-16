/**
 * Clash Detection Utility
 * Checks for booking conflicts based on date, time, and resource
 */

/**
 * Check if two time slots overlap
 * @param {Object} slot1 - First time slot {start: "HH:MM", end: "HH:MM"}
 * @param {Object} slot2 - Second time slot {start: "HH:MM", end: "HH:MM"}
 * @returns {Boolean} - True if slots overlap
 */
const doTimeSlotsOverlap = (slot1, slot2) => {
    const start1 = timeToMinutes(slot1.start);
    const end1 = timeToMinutes(slot1.end);
    const start2 = timeToMinutes(slot2.start);
    const end2 = timeToMinutes(slot2.end);

    // Check if there's any overlap
    return (start1 < end2 && end1 > start2);
};

/**
 * Convert time string to minutes since midnight
 * @param {String} time - Time in "HH:MM" format
 * @returns {Number} - Minutes since midnight
 */
const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Check for booking conflicts
 * @param {Object} newBooking - New booking to check {resourceId, date, timeSlot}
 * @param {Array} existingBookings - Array of existing bookings
 * @returns {Object} - {hasConflict: Boolean, conflictingBooking: Object|null, conflictDetails: String}
 */
const checkForConflicts = (newBooking, existingBookings) => {
    for (const booking of existingBookings) {
        // Check if same resource and same date
        if (
            booking.resourceId.toString() === newBooking.resourceId.toString() &&
            booking.date === newBooking.date &&
            booking.status !== 'rejected' &&
            booking.status !== 'cancelled'
        ) {
            // Check if time slots overlap
            if (doTimeSlotsOverlap(newBooking.timeSlot, booking.timeSlot)) {
                return {
                    hasConflict: true,
                    conflictingBooking: booking,
                    conflictDetails: `Conflict with booking #${booking._id} on ${booking.date} from ${booking.timeSlot.start} to ${booking.timeSlot.end}`
                };
            }
        }
    }

    return {
        hasConflict: false,
        conflictingBooking: null,
        conflictDetails: null
    };
};

/**
 * Get all conflicting bookings for a given booking
 * @param {Object} booking - Booking to check
 * @param {Array} allBookings - All bookings to check against
 * @returns {Array} - Array of conflicting bookings
 */
const getAllConflicts = (booking, allBookings) => {
    const conflicts = [];

    for (const otherBooking of allBookings) {
        if (
            otherBooking._id.toString() !== booking._id.toString() &&
            otherBooking.resourceId.toString() === booking.resourceId.toString() &&
            otherBooking.date === booking.date &&
            otherBooking.status !== 'rejected' &&
            otherBooking.status !== 'cancelled'
        ) {
            if (doTimeSlotsOverlap(booking.timeSlot, otherBooking.timeSlot)) {
                conflicts.push(otherBooking);
            }
        }
    }

    return conflicts;
};

module.exports = {
    doTimeSlotsOverlap,
    timeToMinutes,
    checkForConflicts,
    getAllConflicts
};
