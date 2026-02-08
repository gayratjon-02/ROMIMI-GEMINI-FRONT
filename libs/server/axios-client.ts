// libs/server/axios-client.ts
// Centralized Axios client with automatic Bearer token injection
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

// Create axios instance with base configuration
const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Include cookies for auth if needed
});

/**
 * Request Interceptor: Automatically attach Bearer token to every request
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
