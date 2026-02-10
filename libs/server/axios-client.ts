// libs/server/axios-client.ts
// Centralized Axios client with automatic Bearer token injection
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance with base configuration
const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Include cookies for auth if needed
});

/**
 * Request Interceptor: Automatically attach Bearer token to every request
 * and handle Content-Type for FormData vs JSON
 */
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Only access localStorage on client-side
        if (typeof window !== 'undefined') {
            // Check multiple potential token keys for compatibility
            const token =
                localStorage.getItem('auth_token') ||
                localStorage.getItem('token') ||
                localStorage.getItem('accessToken') ||
                localStorage.getItem('sb-access-token');

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        // Smart Content-Type handling
        // If sending FormData, DELETE Content-Type to let browser set it with boundary
        // Otherwise, ensure JSON Content-Type for regular payloads
        if (config.data instanceof FormData) {
            // Delete Content-Type to allow browser to auto-generate multipart boundary
            delete config.headers['Content-Type'];
        } else if (config.data && typeof config.data === 'object') {
            // Explicitly set JSON for object payloads
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor: Handle 401 errors globally
 */
axiosClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            console.error('Unauthorized: Session expired or invalid token');

            // Only redirect on client-side
            if (typeof window !== 'undefined') {
                // Clear stale tokens
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');

                // Redirect to login page
                window.location.href = '/signup';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
