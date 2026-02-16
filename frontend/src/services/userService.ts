import api from './api';
import { User } from '@/types';

interface UsersResponse {
    success: boolean;
    count: number;
    data: User[];
}

interface UserResponse {
    success: boolean;
    data: User;
}

export const userService = {
    // Get all users
    getAll: async (): Promise<User[]> => {
        const response = await api.get<UsersResponse>('/users');
        return response.data.data.map(user => ({
            ...user,
            id: user.id || user._id || ''
        }));
    },

    // Alias for getAll
    getAllUsers: async (): Promise<User[]> => {
        const response = await api.get<UsersResponse>('/users');
        return response.data.data.map(user => ({
            ...user,
            id: user.id || user._id || ''
        }));
    },

    // Get user by ID
    getById: async (id: string): Promise<User> => {
        const response = await api.get<UserResponse>(`/users/${id}`);
        const user = response.data.data;
        return {
            ...user,
            id: user.id || user._id || ''
        };
    },

    // Update user
    update: async (id: string, user: Partial<User>): Promise<User> => {
        const response = await api.put<UserResponse>(`/users/${id}`, user);
        return response.data.data;
    },

    // Delete user
    delete: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`);
    },

    // Block user
    block: async (id: string, reason?: string): Promise<User> => {
        const response = await api.put<UserResponse>(`/users/${id}/block`, { reason });
        return response.data.data;
    },

    // Unblock user
    unblock: async (id: string): Promise<User> => {
        const response = await api.put<UserResponse>(`/users/${id}/unblock`);
        return response.data.data;
    },
};
