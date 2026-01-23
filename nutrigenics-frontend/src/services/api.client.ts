import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Validate required environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    throw new Error(
        'VITE_API_BASE_URL is not set. Please add it to your .env file.\n' +
        'Example: VITE_API_BASE_URL=http://localhost:8000'
    );
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true, // Important for Django session/CSRF
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for CSRF token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Get CSRF token from cookie
        const csrfToken = getCookie('csrftoken');
        if (csrfToken && config.headers) {
            config.headers['X-CSRFToken'] = csrfToken;
        }

        // Add JWT token if available
        const accessToken = localStorage.getItem('access_token');
        if (accessToken && config.headers) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                if (refreshToken) {
                    // Try to refresh the token
                    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
                        refresh: refreshToken
                    });

                    if (response.data.access) {
                        localStorage.setItem('access_token', response.data.access);

                        // Retry the original request
                        originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                        return apiClient(originalRequest);
                    }
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
            }

            // If refresh fails or no refresh token, trigger logout
            console.warn('Unauthorized access (401) - triggering logout');
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }

        if (error.response) {
            // Server responded with error status
            switch (error.response.status) {
                case 403:
                    // Forbidden
                    console.error('Access forbidden:', error.response.data);
                    break;
                case 404:
                    // Only log 404 if it is not expected (for search etc 404 is sometimes valid)
                    // console.error('Resource not found:', error.response.data);
                    break;
                case 500:
                    // Server error
                    console.error('Server error:', error.response.data);
                    break;
            }
        }

        return Promise.reject(error);
    }
);

// Helper function to get cookie value
function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
}

export default apiClient;
