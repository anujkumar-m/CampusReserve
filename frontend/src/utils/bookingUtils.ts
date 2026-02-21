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

// ─── Conflict Detection ────────────────────────────────────────────────────

/** Convert "HH:MM" to total minutes since midnight */
function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

/** Return true if two time ranges overlap (any overlap including containment) */
function timeSlotsOverlap(
    a: { start: string; end: string },
    b: { start: string; end: string }
): boolean {
    const aStart = timeToMinutes(a.start);
    const aEnd = timeToMinutes(a.end);
    const bStart = timeToMinutes(b.start);
    const bEnd = timeToMinutes(b.end);
    // Overlap if neither ends before the other starts
    return aStart < bEnd && aEnd > bStart;
}

/** Statuses that count as "active" and can produce conflicts */
const ACTIVE_STATUSES = new Set(['auto_approved', 'pending_hod', 'pending_admin', 'approved']);

/**
 * Enrich every booking in the list with a dynamically computed `conflictWarning`.
 * Checks ALL pairs on the same resource/date against each other regardless of
 * whether the backend stored a conflictWarning at creation time.
 */
export function computeConflicts(bookings: Booking[]): Booking[] {
    // Index active bookings by "resourceId|date"
    const groups = new Map<string, Booking[]>();
    for (const b of bookings) {
        if (!ACTIVE_STATUSES.has(b.status)) continue;
        const key = `${typeof b.resourceId === 'string' ? b.resourceId : (b.resourceId as any)?.toString?.() ?? ''}|${b.date}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(b);
    }

    // Build a map of conflicting booking details for each booking id
    const conflictMap = new Map<string, { conflictingBookingId: string; conflictDetails: string }>();

    for (const group of groups.values()) {
        if (group.length < 2) continue;  // No conflict possible with a single booking
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const a = group[i];
                const b = group[j];
                if (timeSlotsOverlap(a.timeSlot, b.timeSlot)) {
                    // Mark a as conflicting with b
                    if (!conflictMap.has(a.id)) {
                        conflictMap.set(a.id, {
                            conflictingBookingId: b.id,
                            conflictDetails: `Conflicts with "${b.userName}"'s booking on ${b.date} from ${b.timeSlot.start}–${b.timeSlot.end}`,
                        });
                    }
                    // Mark b as conflicting with a
                    if (!conflictMap.has(b.id)) {
                        conflictMap.set(b.id, {
                            conflictingBookingId: a.id,
                            conflictDetails: `Conflicts with "${a.userName}"'s booking on ${a.date} from ${a.timeSlot.start}–${a.timeSlot.end}`,
                        });
                    }
                }
            }
        }
    }

    // Return enriched bookings:
    // - If client-side detected a conflict → use it (most accurate, has user names)
    // - If not → fall back to backend-stored conflictWarning (covers cross-user conflicts
    //   that regular users can't compute because they only see their own bookings)
    return bookings.map((b) => {
        // Rejected / cancelled bookings should never show a conflict warning.
        if (!ACTIVE_STATUSES.has(b.status)) {
            return { ...b, conflictWarning: { hasConflict: false } };
        }
        // For active bookings:
        // - Prefer the client-side live result (most accurate, has user names)
        // - Fall back to the backend's returned conflictWarning (covers cross-user
        //   conflicts that regular users can't compute because they only see their
        //   own bookings). The backend now always returns a live result, not stale.
        const conflict = conflictMap.get(b.id);
        return {
            ...b,
            conflictWarning: conflict
                ? { hasConflict: true, ...conflict }
                : (b.conflictWarning ?? { hasConflict: false }),
        };
    });
}
