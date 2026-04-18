import apiClient from './api.client';
import type { Dietitian, Hospital, HospitalManagedPatient } from '../types';

export const hospitalDashboardService = {
    // Dashboard Overviews
    async getDashboard() {
        const response = await apiClient.get('/api/v1/hospitals/dashboard/');
        return response.data;
    },

    async getManagedDietitians(search?: string) {
        const params = search ? { search } : {};
        const response = await apiClient.get<{ count: number; results: Dietitian[] }>('/api/v1/hospitals/managed-dietitians/', { params });
        return response.data;
    },

    async getManagedPatients(search?: string) {
        const params = search ? { search } : {};
        const response = await apiClient.get<{ count: number; results: HospitalManagedPatient[] }>('/api/v1/hospitals/managed-patients/', { params });
        return response.data;
    },

    // Requests Management
    async getRequests() {
        const response = await apiClient.get('/api/v1/hospital-requests/');
        return response.data;
    },

    async respondRequest(id: number, status: 'approved' | 'rejected') {
        const response = await apiClient.post(`/api/v1/hospital-requests/${id}/respond/`, { status });
        return response.data;
    },

    // Profile Management
    async getMe() {
        const response = await apiClient.get<Hospital>('/api/v1/hospitals/me/');
        return response.data;
    },

    async updateProfile(id: number, data: Partial<Hospital>) {
        const response = await apiClient.patch<Hospital>(`/api/v1/hospitals/${id}/`, data);
        return response.data;
    },

    // Reference Lists
    async listActive() {
        const response = await apiClient.get<Hospital[]>('/api/v1/hospitals/list_active/');
        return (response.data as unknown as { hospitals?: Hospital[] }).hospitals || response.data;
    }
};
