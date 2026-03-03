import axios from 'axios';

// Create axios instance with base URL
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_BASE_URL = rawUrl.replace(/\/$/, '').trim();

console.log('🚀 API_BASE_URL is currently set to:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL + '/api/v1',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Debug interceptor to log network errors clearly
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error('NETWORK ERROR: Possible causes include CORS failure, backend down, or incorrect VITE_API_URL.');
            console.error('Target URL:', error.config?.url);
        }
        return Promise.reject(error);
    }
);

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const loginUser = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// Profile Management
export const getProfile = async () => {
    try {
        const response = await api.get('/users/profile');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const updateProfile = async (userData) => {
    try {
        const response = await api.patch('/users/profile', userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const changePassword = async (passwordData) => {
    try {
        const response = await api.patch('/users/change-password', passwordData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// Admin User Management
export const getUsers = async () => {
    try {
        const response = await api.get('/users');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const createUser = async (userData) => {
    try {
        const response = await api.post('/users', userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const updateUser = async (id, userData) => {
    try {
        const response = await api.patch(`/users/${id}`, userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const uploadAvatar = async (id, file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/users/${id}/upload-avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const deleteUser = async (id) => {
    try {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export default api;
