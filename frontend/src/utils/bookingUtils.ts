import { Booking } from '@/types';

/**
 * Check if a booking's date and time has passed
 * @param booking - The booking to check
 * @returns true if the booking is in the past
 */
export function isBookingInPast(booking: Booking): boolean {
    try {
        // Combine date and end time to get the full booking end datetime
        const bookingEndDateTime = new Date(`${booking.date}T${booking.timeSlot.end}`);
        const now = new Date();
        return bookingEndDateTime < now;
    } catch (error) {
        console.error('Error checking if booking is in past:', error);
        return false; // Default to allowing actions if there's an error
    }
}

/**
 * Check if a booking can be cancelled
 * A booking can be cancelled if:
 * - It's not already rejected or cancelled
 * - The booking date/time hasn't passed yet
 * @param booking - The booking to check
 * @returns true if the booking can be cancelled
 */
export function canCancelBooking(booking: Booking): boolean {
    const isNotCancelledOrRejected = booking.status !== 'rejected' && booking.status !== 'cancelled';
    const isNotInPast = !isBookingInPast(booking);
    return isNotCancelledOrRejected && isNotInPast;
}

/**
 * Check if a booking can be rescheduled
 * A booking can be rescheduled if:
 * - It's approved or auto-approved
 * - The booking date/time hasn't passed yet
 * @param booking - The booking to check
 * @returns true if the booking can be rescheduled
 */
export function canRescheduleBooking(booking: Booking): boolean {
    const isApproved = booking.status === 'approved' || booking.status === 'auto_approved';
    const isNotInPast = !isBookingInPast(booking);
    return isApproved && isNotInPast;
}

/**
 * Check if approval actions can be taken on a booking
 * Approval actions can be taken if:
 * - The booking is pending
 * - The booking date/time hasn't passed yet
 * @param booking - The booking to check
 * @returns true if approval actions can be taken
 */
export function canApproveBooking(booking: Booking): boolean {
    const isPending = booking.status === 'pending_hod' || booking.status === 'pending_admin';
    const isNotInPast = !isBookingInPast(booking);
    return isPending && isNotInPast;
}
