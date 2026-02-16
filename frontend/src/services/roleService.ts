import { User } from '@/types';
import api from './api';

interface RoleAssignmentData {
    email: string;
    role: string;
    department?: string;
    clubName?: string;
}

export const roleService = {
    // Assign role to user by email
    assignRole: async (data: RoleAssignmentData) => {
        const response = await api.post('/roles/assign', data);
        return response.data;
    },

    // Get pending role assignments
    getPendingRoles: async () => {
        const response = await api.get('/roles/pending');
        return response.data;
    },
};
