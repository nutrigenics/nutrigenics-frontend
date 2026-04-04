import apiClient from './api.client';

export interface DashboardStats {
    total_patients: number;
    patients: any[]; // We can refine this type later
    pending_requests_count: number;
    unread_messages_count: number;
    is_approved: boolean;
    hospital_request_status: string | null;
    dietitian: any;
}

export const dietitianDashboardService = {
    async getDashboardStats() {
        const response = await apiClient.get('/api/v1/dietitians/dashboard/');
        return response.data;
    },

    async getPatients(search?: string) {
        const params = search ? { search } : {};
        const response = await apiClient.get('/api/v1/patients/', { params });
        return response.data;
    },

    async getMe() {
        const response = await apiClient.get('/api/v1/dietitians/me/');
        return response.data;
    },

    async updateProfile(id: number, data: any) {
        const response = await apiClient.patch(`/api/v1/dietitians/${id}/`, data);
        return response.data;
    },

    async requestPatient(data: { patient_id: string; message?: string }) {
        const response = await apiClient.post('/api/v1/dietitians/request_patient/', data);
        return response.data;
    },

    async getNutrientLimits(patientId: number) {
        const response = await apiClient.get('/api/v1/nutrient-limits/', { params: { patient_id: patientId } });
        return response.data;
    },

    async createNutrientLimit(data: any) {
        const response = await apiClient.post('/api/v1/nutrient-limits/', data);
        return response.data;
    },

    async updateNutrientLimit(id: number, data: any) {
        const response = await apiClient.patch(`/api/v1/nutrient-limits/${id}/`, data);
        return response.data;
    }
};
