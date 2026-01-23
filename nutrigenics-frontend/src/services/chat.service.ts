import apiClient from './api.client';

export interface Message {
    id: number;
    sender: number;
    sender_email: string;
    receiver: number;
    receiver_email: string;
    content: string;
    timestamp: string;
    is_read: boolean;
}

export const chatService = {
    async getMessages(otherUserId?: number) {
        const params = otherUserId ? { other_user_id: otherUserId } : {};
        const response = await apiClient.get('/api/v1/messages/', { params });
        return response.data.results || response.data; // Handle pagination if present
    },

    async sendMessage(content: string, receiverId: number) {
        const response = await apiClient.post('/api/v1/messages/', {
            content,
            receiver: receiverId
        });
        return response.data;
    },

    async markRead(messageId: number) {
        const response = await apiClient.post(`/api/v1/messages/${messageId}/mark_read/`);
        return response.data;
    }
};
