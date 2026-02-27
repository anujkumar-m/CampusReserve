import api from './api';

export const bookingTypeService = {
    getAll: async () => {
        const res = await api.get('/booking-types');
        return res.data.data;
    },

    create: async (data: { name: string; value: string; description?: string; priority?: string; isActive?: boolean }) => {
        const res = await api.post('/booking-types', data);
        return res.data.data;
    },

    update: async (id: string, data: { name?: string; value?: string; description?: string; priority?: string; isActive?: boolean }) => {
        const res = await api.put(`/booking-types/${id}`, data);
        return res.data.data;
    },

    remove: async (id: string) => {
        const res = await api.delete(`/booking-types/${id}`);
        return res.data;
    },
};

