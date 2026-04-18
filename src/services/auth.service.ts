import apiClient from './api.client';
import type { LoginFormData, SignupFormData, OnboardingFormData, BaseUser } from '../types';

const storeTokens = (data: { access?: string; refresh?: string }) => {
    if (data.access) {
        localStorage.setItem('access_token', data.access);
    }
    if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
    }
};

export const authService = {
    /**
     * Login with email and password
     * Returns JWT tokens
     */
    async login(credentials: LoginFormData) {
        const response = await apiClient.post('/api/v1/auth/login/', {
            email: credentials.email,
            password: credentials.password
        });

        storeTokens(response.data);
        return response.data;
    },

    /**
     * Guest login - only available when the backend explicitly enables it.
     */
    async guestLogin() {
        const response = await apiClient.post('/api/v1/auth/guest-login/');
        storeTokens(response.data);
        return response.data;
    },

    /**
     * Signup new user
     */
    async signup(data: SignupFormData) {
        const response = await apiClient.post('/api/v1/auth/register/', {
            ...data,
            password_confirm: data.password2
        });
        storeTokens(response.data);
        return response.data;
    },

    /**
     * Get current user profile
     */
    async getProfile(): Promise<BaseUser> {
        const response = await apiClient.get('/api/v1/auth/profile/');
        return response.data;
    },

    /**
     * Update user profile
     */
    async updateProfile(data: Partial<BaseUser> | FormData) {
        const response = await apiClient.put('/api/v1/auth/profile/', data);
        return response.data;
    },

    /**
     * Complete onboarding
     */
    async completeOnboarding(data: OnboardingFormData, role: 'patient' | 'dietitian' | 'hospital') {
        let endpoint = '/api/v1/patients/onboard/';

        if (role === 'dietitian') {
            endpoint = '/api/v1/dietitians/onboard/';
        } else if (role === 'hospital') {
            endpoint = '/api/v1/hospitals/onboard/';
        }

        const response = await apiClient.post(endpoint, data);
        return response.data;
    },

    /**
     * Logout current user
     */
    async logout() {
        try {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    /**
     * Refresh access token
     */
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await apiClient.post('/api/v1/auth/token/refresh/', {
                refresh: refreshToken
            });

            if (response.data.access) {
                localStorage.setItem('access_token', response.data.access);
            }

            return response.data;
        } catch (error: any) {
            // Clear tokens on refresh failure
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            throw error;
        }
    },

    /**
     * Request a Password Reset OTP
     * POST /api/v1/auth/password-reset/request/
     */
    async requestPasswordReset(email: string) {
        const response = await apiClient.post('/api/v1/auth/password-reset/request/', { email });
        return response.data;
    },

    /**
     * Confirm Password Reset with OTP
     * POST /api/v1/auth/password-reset/confirm/
     */
    async confirmPasswordReset(data: any) {
        const response = await apiClient.post('/api/v1/auth/password-reset/confirm/', data);
        return response.data;
    },

    /**
     * Change password
     */
    async changePassword(data: any) {
        const response = await apiClient.post('/api/v1/auth/password/change/', data);
        return response.data;
    },

    /**
     * Get reference data (allergies, cuisines, diets)
     */
    async getReferenceData() {
        try {
            const response = await apiClient.get('/api/v1/reference-data/');
            return response.data;
        } catch (error: any) {
            return { allergies: [], cuisines: [], diets: [] };
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!localStorage.getItem('access_token');
    },

    /**
     * Delete user account
     * @param password - Optional password confirmation for extra security
     */
    async deleteAccount(password?: string) {
        const response = await apiClient.delete('/api/v1/auth/account/delete/', {
            data: password ? { password } : {}
        });

        // Clear tokens after successful deletion
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        return response.data;
    },

    /**
     * Get access token
     */
    getAccessToken(): string | null {
        return localStorage.getItem('access_token');
    }
};
