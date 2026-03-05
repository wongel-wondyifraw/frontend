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
        const response = await api.post('/users', userData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
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

// ==================== Members Management ====================

export const getMembers = async () => {
    try {
        const response = await api.get('/members');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const getMemberById = async (id) => {
    try {
        const response = await api.get(`/members/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const createMember = async (memberData) => {
    try {
        const response = await api.post('/members', memberData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const updateMember = async (id, memberData) => {
    try {
        const response = await api.patch(`/members/${id}`, memberData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const deleteMember = async (id) => {
    try {
        const response = await api.delete(`/members/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// ==================== Ministries Management ====================

export const getMinistries = async () => {
    try {
        const response = await api.get('/ministries');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const getMinistry = async (id) => {
    try {
        const response = await api.get(`/ministries/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const createMinistry = async (ministryData) => {
    try {
        const response = await api.post('/ministries', ministryData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const updateMinistry = async (id, ministryData) => {
    try {
        const response = await api.patch(`/ministries/${id}`, ministryData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const deleteMinistry = async (id) => {
    try {
        const response = await api.delete(`/ministries/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// ==================== Ministry Members ====================

export const getMinistryMembers = async (ministryId) => {
    try {
        const response = await api.get(`/ministries/${ministryId}/members`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const addMinistryMember = async (ministryId, memberId) => {
    try {
        const response = await api.post(`/ministries/${ministryId}/members/${memberId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const removeMinistryMember = async (ministryId, memberId) => {
    try {
        const response = await api.delete(`/ministries/${ministryId}/members/${memberId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export const getMemberMinistries = async (memberId) => {
    try {
        const response = await api.get(`/members/${memberId}/ministries`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

export default api;
