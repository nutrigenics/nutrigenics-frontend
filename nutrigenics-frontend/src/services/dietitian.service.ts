import apiClient from './api.client';

export const dietitianService = {
    async getMyDietitian() {
        const response = await apiClient.get('/api/v1/patients/my_dietitian/');
        return response.data;
    },

    async getDietitians() {
        const response = await apiClient.get('/api/v1/dietitians/');
        return response.data;
    },

    async requestDietitian(dietitianId: number, message: string) {
        const response = await apiClient.post('/api/v1/dietitian-requests/', {
            dietitian: dietitianId,
            message
        });
        return response.data;
    },

    async getPendingRequests() {
        const response = await apiClient.get('/api/v1/dietitian-requests/');
        return response.data;
    },

    async respondRequest(requestId: number, status: 'accepted' | 'rejected') {
        const response = await apiClient.post(`/api/v1/dietitian-requests/${requestId}/respond/`, { status });
        return response.data;
    }
};
