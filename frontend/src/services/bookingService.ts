import api from './api';
import { Booking, BookingStatus, BookingType } from '@/types';

interface BookingsResponse {
    success: boolean;
    count: number;
    data: Booking[];
}

interface BookingResponse {
    success: boolean;
    data: Booking;
    message?: string;
}

interface CreateBookingData {
    resourceId: string;
    date: string;
    timeSlot: {
        start: string;
        end: string;
    };
    purpose: string;
    bookingType?: BookingType;
}

export const bookingService = {
    // Get all bookings
    getAll: async (filters?: {
        status?: BookingStatus;
        resourceId?: string;
    }): Promise<Booking[]> => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.resourceId) params.append('resourceId', filters.resourceId);

        const response = await api.get<BookingsResponse>(`/bookings?${params.toString()}`);
        return response.data.data;
    },

    // Get pending bookings (legacy)
    getPending: async (): Promise<Booking[]> => {
        const response = await api.get<BookingsResponse>('/bookings/pending');
        return response.data.data;
    },

    // Get bookings pending approval (new)
    getPendingApprovals: async (): Promise<Booking[]> => {
        const response = await api.get<BookingsResponse>('/bookings/pending-approval');
        return response.data.data;
    },

    // Get booking by ID
    getById: async (id: string): Promise<Booking> => {
        const response = await api.get<BookingResponse>(`/bookings/${id}`);
        return response.data.data;
    },

    // Create booking
    create: async (booking: CreateBookingData): Promise<Booking> => {
        const response = await api.post<BookingResponse>('/bookings', booking);
        return response.data.data;
    },

    // Approve booking
    approve: async (id: string): Promise<Booking> => {
        const response = await api.put<BookingResponse>(`/bookings/${id}/approve`);
        return response.data.data;
    },

    // Reject booking
    reject: async (id: string, reason: string): Promise<Booking> => {
        const response = await api.put<BookingResponse>(`/bookings/${id}/reject`, { reason });
        return response.data.data;
    },

    // Cancel booking
    cancel: async (id: string): Promise<void> => {
        await api.put(`/bookings/${id}/cancel`);
    },

    // Update booking status (legacy)
    updateStatus: async (id: string, status: BookingStatus): Promise<Booking> => {
        const response = await api.put<BookingResponse>(`/bookings/${id}/status`, { status });
        return response.data.data;
    },

    // Delete booking
    delete: async (id: string): Promise<void> => {
        await api.delete(`/bookings/${id}`);
    },

    // Get audit log for booking
    getAudit: async (id: string): Promise<any[]> => {
        const response = await api.get<{ success: boolean; count: number; data: any[] }>(`/bookings/${id}/audit`);
        return response.data.data;
    },

    // Admin: Reschedule booking
    reschedule: async (id: string, data: { date: string; timeSlot: { start: string; end: string }; reason?: string }): Promise<Booking> => {
        const response = await api.put<BookingResponse>(`/bookings/${id}/reschedule`, data);
        return response.data.data;
    },

    // Admin: Delete booking
    deleteAdmin: async (id: string, reason?: string): Promise<void> => {
        await api.delete(`/bookings/${id}/admin`, { data: { reason } });
    },

    // Admin: Approve booking (override)
    approveAdmin: async (id: string): Promise<Booking> => {
        const response = await api.put<BookingResponse>(`/bookings/${id}/approve-admin`);
        return response.data.data;
    },

    // Admin: Reject booking (override)
    rejectAdmin: async (id: string, reason: string): Promise<Booking> => {
        const response = await api.put<BookingResponse>(`/bookings/${id}/reject-admin`, { reason });
        return response.data.data;
    },
};

