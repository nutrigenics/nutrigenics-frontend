import apiClient from './api.client';
import type { LoginFormData, SignupFormData, OnboardingFormData, BaseUser } from '../types';

export const authService = {
    /**
     * Login with email and password
     * Returns JWT tokens
     */
    async login(credentials: LoginFormData) {
        const response = await apiClient.post('/api/v1/auth/token/', {
            email: credentials.email,  // Django backend uses 'email' field, not 'username'
            password: credentials.password
        });

        // Store tokens
        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
        }
        if (response.data.refresh) {
            localStorage.setItem('refresh_token', response.data.refresh);
        }

        return response.data;
    },

    /**
     * Guest login - auto-login with backend guest account
     * FOR DEVELOPMENT/TESTING ONLY - Disabled in production
     */
    /**
     * Guest login - auto-login with backend guest account
     * role defaults to 'patient'
     */
    async guestLogin(role: 'patient' | 'dietitian' | 'hospital' = 'patient') {
        // We use the specific guest emails setup by the backend script
        let email = 'guest@nutrigenics.care';

        if (role === 'dietitian') {
            email = 'dietitian@nutrigenics.care';
        } else if (role === 'hospital') {
            email = 'hospital@nutrigenics.care';
        }

        // We use the standard login endpoint with guest credentials
        const response = await apiClient.post('/api/v1/auth/token/', {
            email: email,
            password: 'guest123'
        });

        // Store tokens
        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
        }
        if (response.data.refresh) {
            localStorage.setItem('refresh_token', response.data.refresh);
        }

        // Set guest mode flag for any frontend mocks if needed (though we are using real backend user now)
        localStorage.setItem('is_guest_mode', 'true');

        return response.data;
    },

    /**
     * Signup new user
     */
    async signup(data: SignupFormData) {
        const response = await apiClient.post('/api/v1/auth/signup/', data);
        return response.data;
    },

    /**
     * Get current user profile
     */
    async getProfile(): Promise<BaseUser> {
        // Check if guest mode
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_GUEST_PROFILE } = await import('@/data/mockData');
            return MOCK_GUEST_PROFILE as any;
        }
        const response = await apiClient.get('/api/v1/auth/profile/');
        return response.data;
    },

    /**
     * Update user profile
     */
    async updateProfile(data: Partial<BaseUser> | FormData) {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            return { user: { id: 999 } }; // Mock update
        }

        // If data is FormData, let axios handle the headers (multipart/form-data)
        // Otherwise it sends JSON
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
            // Clear tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // Clear guest flag
            localStorage.removeItem('is_guest_mode');

            // Optionally call backend logout endpoint if it exists
            // await apiClient.post('/api/v1/auth/logout/');

            // Optionally call backend logout endpoint if it exists
            // await apiClient.post('/api/v1/auth/logout/');
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
