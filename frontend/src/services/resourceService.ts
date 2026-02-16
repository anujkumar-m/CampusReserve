import api from './api';
import { Resource } from '@/types';

interface ResourcesResponse {
    success: boolean;
    count: number;
    data: Resource[];
}

interface ResourceResponse {
    success: boolean;
    data: Resource;
}

export const resourceService = {
    // Get all resources
    getAll: async (filters?: {
        type?: string;
        department?: string;
        isAvailable?: boolean;
    }): Promise<Resource[]> => {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.department) params.append('department', filters.department);
        if (filters?.isAvailable !== undefined) params.append('isAvailable', String(filters.isAvailable));

        const response = await api.get<ResourcesResponse>(`/resources?${params.toString()}`);
        // Transform MongoDB _id to id for frontend
        return response.data.data.map((resource: any) => ({
            ...resource,
            id: resource._id || resource.id,
        }));
    },

    // Get resource by ID
    getById: async (id: string): Promise<Resource> => {
        const response = await api.get<ResourceResponse>(`/resources/${id}`);
        const resource: any = response.data.data;
        return {
            ...resource,
            id: resource._id || resource.id,
        };
    },

    // Create resource
    create: async (resource: Omit<Resource, 'id'>): Promise<Resource> => {
        const response = await api.post<ResourceResponse>('/resources', resource);
        return response.data.data;
    },

    // Update resource
    update: async (id: string, resource: Partial<Resource>): Promise<Resource> => {
        const response = await api.put<ResourceResponse>(`/resources/${id}`, resource);
        return response.data.data;
    },

    // Delete resource
    delete: async (id: string): Promise<void> => {
        await api.delete(`/resources/${id}`);
    },
};
