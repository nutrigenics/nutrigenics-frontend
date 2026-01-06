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
        // We can infer this from getMyDietitian pending_requests count, 
        // or fetch from /dietitian-requests/ if needed.
        // For now the dashboard status uses my_dietitian.
        // But if we want to list them:
        const response = await apiClient.get('/api/v1/dietitian-requests/');
        return response.data;
    }
};
