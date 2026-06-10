import axios, { type AxiosError } from 'axios';
import type {
  ApiSearchResult,
  DashboardStats,
  LoginResponse,
  Member,
  Ministry,
  MinistryMember,
  PaginatedResponse,
  PaginationParams,
  User,
} from '@/types';

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const API_BASE_URL = rawUrl.replace(/\/$/, '').trim();

if (process.env.NODE_ENV === 'development') {
  console.log('API_BASE_URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getErrorMessage(error: unknown): { message: string; statusCode?: number } {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[]; statusCode?: number } | undefined;
    const message = Array.isArray(data?.message)
      ? data.message[0]
      : data?.message || error.message;
    return { message: message || 'Request failed', statusCode: data?.statusCode };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'Request failed' };
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      console.error('NETWORK ERROR: Possible causes include CORS failure, backend down, or incorrect NEXT_PUBLIC_API_URL.');
      console.error('Target URL:', error.config?.url);
    }
    return Promise.reject(error);
  },
);

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', {
      email: email.trim(),
      password,
    });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const getProfile = async (): Promise<User> => {
  try {
    const response = await api.get<User>('/users/profile');
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const updateProfile = async (userData: FormData | Record<string, unknown>): Promise<User> => {
  try {
    const response = await api.patch<User>('/users/profile', userData);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const changePassword = async (passwordData: Record<string, string>): Promise<{ message: string }> => {
  try {
    const response = await api.patch<{ message: string }>('/users/change-password', passwordData);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get<User[]>('/users');
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const createUser = async (userData: FormData): Promise<User> => {
  try {
    const response = await api.post<User>('/users', userData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const updateUser = async (id: string, userData: FormData | Record<string, unknown>): Promise<User> => {
  try {
    const response = await api.patch<User>(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const uploadAvatar = async (id: string, file: File): Promise<User> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<User>(`/users/${id}/upload-avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await api.delete(`/users/${id}`);
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const getMembers = async (params: PaginationParams = {}): Promise<PaginatedResponse<Member>> => {
  try {
    const response = await api.get<PaginatedResponse<Member>>('/members', { params });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const getMembersList = async (): Promise<Member[]> => {
  const result = await getMembers({ page: 1, limit: 100 });
  return result.data;
};

export const getMemberById = async (id: string): Promise<Member> => {
  try {
    const response = await api.get<Member>(`/members/${id}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const createMember = async (memberData: FormData): Promise<Member> => {
  try {
    const response = await api.post<Member>('/members', memberData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const updateMember = async (id: string, memberData: FormData | Record<string, unknown>): Promise<Member> => {
  try {
    const response = await api.patch<Member>(`/members/${id}`, memberData);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const deleteMember = async (id: string): Promise<void> => {
  try {
    await api.delete(`/members/${id}`);
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const getMinistries = async (params: PaginationParams = {}): Promise<PaginatedResponse<Ministry>> => {
  try {
    const response = await api.get<PaginatedResponse<Ministry>>('/ministries', { params });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const searchDashboard = async (query: string): Promise<ApiSearchResult[]> => {
  try {
    const response = await api.get<ApiSearchResult[]>('/dashboard/search', { params: { q: query } });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const getMinistry = async (id: string): Promise<Ministry> => {
  try {
    const response = await api.get<Ministry>(`/ministries/${id}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const createMinistry = async (ministryData: Record<string, unknown>): Promise<Ministry> => {
  try {
    const response = await api.post<Ministry>('/ministries', ministryData);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const updateMinistry = async (id: string, ministryData: Record<string, unknown>): Promise<Ministry> => {
  try {
    const response = await api.patch<Ministry>(`/ministries/${id}`, ministryData);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const deleteMinistry = async (id: string): Promise<void> => {
  try {
    await api.delete(`/ministries/${id}`);
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const getMinistryMembers = async (ministryId: string): Promise<MinistryMember[]> => {
  try {
    const response = await api.get<MinistryMember[]>(`/ministries/${ministryId}/members`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const addMinistryMember = async (ministryId: string, memberId: string): Promise<void> => {
  try {
    await api.post(`/ministries/${ministryId}/members/${memberId}`);
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const removeMinistryMember = async (ministryId: string, memberId: string): Promise<void> => {
  try {
    await api.delete(`/ministries/${ministryId}/members/${memberId}`);
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export const getMemberMinistries = async (memberId: string): Promise<Ministry[]> => {
  try {
    const response = await api.get<Ministry[]>(`/members/${memberId}/ministries`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

export default api;
