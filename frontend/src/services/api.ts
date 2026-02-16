import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🌐 API Configuration:');
console.log('   VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('   Final API_URL:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token to headers
api.interceptors.request.use(
    (config) => {
        console.log('📤 Axios request:', config.method?.toUpperCase(), config.url);
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('📤 Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        console.log('📥 Axios response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';

        console.error('📥 Response error:', status, error.message);
        console.error('📥 Failed URL:', url);

        // Only auto-redirect to login for 401 errors on protected endpoints
        // Don't redirect for auth verification endpoints - let AuthContext handle it
        const isAuthEndpoint = url.includes('/auth/me') || url.includes('/auth/login') || url.includes('/auth/register');

        if (status === 401 && !isAuthEndpoint) {
            console.warn('🚪 401 on protected endpoint - logging out');
            // Unauthorized on protected endpoint - clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        } else if (status === 401 && isAuthEndpoint) {
            console.log('ℹ️ 401 on auth endpoint - letting AuthContext handle it');
        }

        return Promise.reject(error);
    }
);

export default api;
