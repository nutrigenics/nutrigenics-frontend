import apiClient from './api.client';

export interface Notification {
    id: number;
    title: string;
    message: string;
    notification_type: string;
    is_read: boolean;
    created_at: string;
}

export const notificationService = {
    async getNotifications(): Promise<Notification[]> {
        const response = await apiClient.get('/api/v1/notifications/');
        return response.data.results || response.data;
    },

    async markRead(id: number): Promise<void> {
        await apiClient.post(`/api/v1/notifications/${id}/mark_read/`);
    },

    async markAllRead(): Promise<void> {
        await apiClient.post('/api/v1/notifications/mark_all_read/');
    },

    async clearAll(): Promise<void> {
        await apiClient.delete('/api/v1/notifications/clear_all/');
    }
};
