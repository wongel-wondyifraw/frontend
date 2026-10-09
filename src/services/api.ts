import axios, {
  type AxiosError,
  type AxiosProgressEvent,
  type InternalAxiosRequestConfig,
} from "axios";
import { ApiRequestError } from "@/lib/errors";
import type {
  ApiSearchResult,
  DashboardStats,
  LoginResponse,
  Member,
  Minister,
  Ministry,
  MinistryMember,
  HomeGroup,
  HomeGroupMember,
  BibleStudy,
  BibleStudyMember,
  TaskAssignment,
  TaskDefinition,
  Plan,
  Family,
  FamilyChild,
  FamilyStats,
  PaginatedResponse,
  PaginationParams,
  Permission,
  Role,
  User,
  Location,
  PageContent,
} from "@/types";

const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const API_BASE_URL = rawUrl
  .replace(/\/$/, "")
  .trim()
  .replace(/\/api\/v1$/i, "");

if (process.env.NODE_ENV === "development") {
  console.log("API_BASE_URL:", API_BASE_URL);
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  },
});

function toApiError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ApiRequestError(
        `Unable to reach the API at ${API_BASE_URL}. Check that the backend is running.`,
      );
    }

    const data = error.response.data as
      { message?: string | string[]; statusCode?: number } | undefined;
    const rawMessage = Array.isArray(data?.message)
      ? data.message[0]
      : data?.message;
    const message =
      (typeof rawMessage === "string" && rawMessage.trim()) ||
      error.message ||
      "Request failed";

    return new ApiRequestError(
      message,
      data?.statusCode ?? error.response.status,
    );
  }

  if (error instanceof Error) {
    return new ApiRequestError(error.message || "Request failed");
  }

  return new ApiRequestError("Request failed");
}

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

export type AuthSession = {
  id: string;
  device_info?: string;
  ip_address?: string;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh" &&
      originalRequest.url !== "/auth/login"
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("refresh_token")
          : null;
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
        );
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.access_token);
          if (data.refresh_token) {
            localStorage.setItem("refresh_token", data.refresh_token);
          }
        }

        api.defaults.headers.common["Authorization"] =
          `Bearer ${data.access_token}`;
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

        processQueue(null, data.access_token);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          window.dispatchEvent(new Event("auth:logout")); // Optional custom event
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    if (!error.response) {
      console.error(
        "NETWORK ERROR: Possible causes include CORS failure, backend down, or incorrect NEXT_PUBLIC_API_URL.",
      );
      console.error("Target URL:", error.config?.url);
    }
    return Promise.reject(error);
  },
);

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export type UploadProgressHandler = (percent: number) => void;

function withUploadProgress(onProgress?: UploadProgressHandler) {
  return {
    headers: { "Content-Type": "multipart/form-data" as const },
    onUploadProgress: (evt: AxiosProgressEvent) => {
      if (!onProgress) return;
      const total = evt.total ?? 0;
      onProgress(
        total > 0 ? Math.min(100, Math.round((evt.loaded / total) * 100)) : 0,
      );
    },
  };
}

export const loginUser = async (
  email: string,
  password: string,
  rememberMe = false,
): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>("/auth/login", {
      email: email.trim(),
      password,
      remember_me: rememberMe,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refresh_token")
        : null;
    if (refreshToken) {
      await api.post("/auth/logout", { refresh_token: refreshToken });
    }
  } catch (error) {
    console.error("Logout API failed:", error);
  }
};

export const logoutAllSessions = async (): Promise<void> => {
  try {
    await api.post("/auth/logout-all");
  } catch (error) {
    throw toApiError(error);
  }
};

export const getSessions = async (): Promise<AuthSession[]> => {
  try {
    const response = await api.get<AuthSession[]>("/auth/sessions");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getProfile = async (): Promise<User> => {
  try {
    const response = await api.get<User>("/users/profile");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateProfile = async (
  userData: FormData | Record<string, unknown>,
): Promise<User> => {
  try {
    const response = await api.patch<User>("/users/profile", userData);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const exportMyData = async (): Promise<Blob> => {
  try {
    const response = await api.get("/users/profile/export", {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const requestAccountDeletion = async (): Promise<{
  message: string;
}> => {
  try {
    const response = await api.post<{ message: string }>(
      "/users/profile/request-deletion",
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const anonymizeUser = async (
  id: string,
): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>(
      `/users/${id}/anonymize`,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const changePassword = async (
  passwordData: Record<string, string>,
): Promise<{ message: string }> => {
  try {
    const response = await api.patch<{ message: string }>(
      "/users/change-password",
      passwordData,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const setupMfa = async (): Promise<{
  secret: string;
  otpauthUrl: string;
}> => {
  try {
    const response = await api.post<{ secret: string; otpauthUrl: string }>(
      "/auth/mfa/setup",
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const verifyMfaSetup = async (
  token: string,
): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>("/auth/mfa/verify", {
      token,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const disableMfa = async (): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>("/auth/mfa/disable");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getUsers = async (
  params: PaginationParams & { origin?: string; role?: string } = {},
): Promise<PaginatedResponse<User>> => {
  try {
    const response = await api.get<PaginatedResponse<User>>("/users", {
      params,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getUserById = async (id: string): Promise<User> => {
  try {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const forceLogoutUser = async (
  id: string,
): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>(
      `/users/${id}/force-logout`,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const adminResetUserPassword = async (
  id: string,
): Promise<{ temporary_password: string }> => {
  try {
    const response = await api.post<{ temporary_password: string }>(
      `/users/${id}/admin-reset-password`,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createUser = async (
  userData: FormData,
  onProgress?: UploadProgressHandler,
): Promise<User> => {
  try {
    const response = await api.post<User>(
      "/users",
      userData,
      withUploadProgress(onProgress),
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateUser = async (
  id: string,
  userData: FormData | Record<string, unknown>,
): Promise<User> => {
  try {
    const response = await api.patch<User>(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const uploadAvatar = async (
  id: string,
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<User> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<User>(
      `/users/${id}/upload-avatar`,
      formData,
      withUploadProgress(onProgress),
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const inviteUser = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>(`/users/${id}/invite`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await api.delete(`/users/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getMembers = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<Member>> => {
  try {
    const response = await api.get<PaginatedResponse<Member>>("/members", {
      params,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
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
    throw toApiError(error);
  }
};

export const createMember = async (
  memberData: Record<string, unknown>,
): Promise<Member> => {
  try {
    const response = await api.post<Member>("/members", memberData);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export type BulkCreateResult = {
  created: number;
  failed: number;
  errors: { index: number; message: string }[];
};

export const createMembersBulk = async (
  items: Record<string, unknown>[],
): Promise<BulkCreateResult> => {
  try {
    const response = await api.post<BulkCreateResult>("/members/bulk", {
      items,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateMember = async (
  id: string,
  memberData: Record<string, unknown>,
): Promise<Member> => {
  try {
    const response = await api.patch<Member>(`/members/${id}`, memberData);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const uploadMemberImage = async (
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ url: string }>(
      "/uploads/image",
      formData,
      withUploadProgress(onProgress),
    );
    return response.data.url;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteMember = async (id: string): Promise<void> => {
  try {
    await api.delete(`/members/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getMinisters = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<Minister>> => {
  try {
    const response = await api.get<PaginatedResponse<Minister>>("/ministers", {
      params,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getMinisterById = async (id: string): Promise<Minister> => {
  try {
    const response = await api.get<Minister>(`/ministers/${id}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createMinister = async (
  data: Record<string, unknown>,
): Promise<Minister> => {
  try {
    const response = await api.post<Minister>("/ministers", data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateMinister = async (
  id: string,
  data: Record<string, unknown>,
): Promise<Minister> => {
  try {
    const response = await api.patch<Minister>(`/ministers/${id}`, data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteMinister = async (id: string): Promise<void> => {
  try {
    await api.delete(`/ministers/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const resetMinisterPassword = async (
  id: string,
): Promise<{ temporary_password: string }> => {
  try {
    const response = await api.post<{ temporary_password: string }>(
      `/ministers/${id}/reset-password`,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getMinistries = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<Ministry>> => {
  try {
    const response = await api.get<PaginatedResponse<Ministry>>("/ministries", {
      params,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get<DashboardStats>("/dashboard/stats");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const searchDashboard = async (
  query: string,
): Promise<ApiSearchResult[]> => {
  try {
    const response = await api.get<ApiSearchResult[]>("/dashboard/search", {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getMinistry = async (id: string): Promise<Ministry> => {
  try {
    const response = await api.get<Ministry>(`/ministries/${id}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createMinistry = async (
  ministryData: Record<string, unknown>,
): Promise<Ministry> => {
  try {
    const response = await api.post<Ministry>("/ministries", ministryData);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateMinistry = async (
  id: string,
  ministryData: Record<string, unknown>,
): Promise<Ministry> => {
  try {
    const response = await api.patch<Ministry>(
      `/ministries/${id}`,
      ministryData,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteMinistry = async (id: string): Promise<void> => {
  try {
    await api.delete(`/ministries/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getMinistryMembers = async (
  ministryId: string,
): Promise<MinistryMember[]> => {
  try {
    const response = await api.get<MinistryMember[]>(
      `/ministries/${ministryId}/members`,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const addMinistryMember = async (
  ministryId: string,
  memberId: string,
): Promise<void> => {
  try {
    await api.post(`/ministries/${ministryId}/members/${memberId}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const removeMinistryMember = async (
  ministryId: string,
  memberId: string,
): Promise<void> => {
  try {
    await api.delete(`/ministries/${ministryId}/members/${memberId}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getMemberMinistries = async (
  memberId: string,
): Promise<Ministry[]> => {
  try {
    const response = await api.get<Ministry[]>(
      `/members/${memberId}/ministries`,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getHomeGroups = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<HomeGroup>> => {
  try {
    const response = await api.get<PaginatedResponse<HomeGroup>>(
      "/home-groups",
      { params },
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getHomeGroup = async (id: string): Promise<HomeGroup> => {
  try {
    const response = await api.get<HomeGroup>(`/home-groups/${id}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createHomeGroup = async (
  data: Record<string, unknown>,
): Promise<HomeGroup> => {
  try {
    const response = await api.post<HomeGroup>("/home-groups", data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateHomeGroup = async (
  id: string,
  data: Record<string, unknown>,
): Promise<HomeGroup> => {
  try {
    const response = await api.patch<HomeGroup>(`/home-groups/${id}`, data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteHomeGroup = async (id: string): Promise<void> => {
  try {
    await api.delete(`/home-groups/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getHomeGroupMembers = async (
  homeGroupId: string,
): Promise<HomeGroupMember[]> => {
  try {
    const response = await api.get<HomeGroupMember[]>(
      `/home-groups/${homeGroupId}/members`,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const addHomeGroupMember = async (
  homeGroupId: string,
  memberId: string,
): Promise<void> => {
  try {
    await api.post(`/home-groups/${homeGroupId}/members/${memberId}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const removeHomeGroupMember = async (
  homeGroupId: string,
  memberId: string,
): Promise<void> => {
  try {
    await api.delete(`/home-groups/${homeGroupId}/members/${memberId}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const uploadDocument = async (
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ url: string }>(
      "/uploads/document",
      formData,
      withUploadProgress(onProgress),
    );
    return response.data.url;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getBibleStudies = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<BibleStudy>> => {
  try {
    const response = await api.get<PaginatedResponse<BibleStudy>>(
      "/bible-studies",
      { params },
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getBibleStudy = async (id: string): Promise<BibleStudy> => {
  try {
    const response = await api.get<BibleStudy>(`/bible-studies/${id}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createBibleStudy = async (
  data: Record<string, unknown>,
): Promise<BibleStudy> => {
  try {
    const response = await api.post<BibleStudy>("/bible-studies", data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateBibleStudy = async (
  id: string,
  data: Record<string, unknown>,
): Promise<BibleStudy> => {
  try {
    const response = await api.patch<BibleStudy>(`/bible-studies/${id}`, data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteBibleStudy = async (id: string): Promise<void> => {
  try {
    await api.delete(`/bible-studies/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getBibleStudyMembers = async (
  bibleStudyId: string,
): Promise<BibleStudyMember[]> => {
  try {
    const response = await api.get<BibleStudyMember[]>(
      `/bible-studies/${bibleStudyId}/members`,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const addBibleStudyMember = async (
  bibleStudyId: string,
  memberId: string,
): Promise<void> => {
  try {
    await api.post(`/bible-studies/${bibleStudyId}/members/${memberId}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const removeBibleStudyMember = async (
  bibleStudyId: string,
  memberId: string,
): Promise<void> => {
  try {
    await api.delete(`/bible-studies/${bibleStudyId}/members/${memberId}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getTaskDefinitions = async (
  activeOnly = false,
): Promise<TaskDefinition[]> => {
  try {
    const response = await api.get<TaskDefinition[]>("/tasks/definitions", {
      params: activeOnly ? { activeOnly: "true" } : undefined,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createTaskDefinition = async (
  data: Record<string, unknown>,
): Promise<TaskDefinition> => {
  try {
    const response = await api.post<TaskDefinition>("/tasks/definitions", data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateTaskDefinition = async (
  id: string,
  data: Record<string, unknown>,
): Promise<TaskDefinition> => {
  try {
    const response = await api.patch<TaskDefinition>(
      `/tasks/definitions/${id}`,
      data,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteTaskDefinition = async (id: string): Promise<void> => {
  try {
    await api.delete(`/tasks/definitions/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getTasks = async (
  params: PaginationParams & {
    status?: string;
    minister_id?: string;
    definition_id?: string;
  } = {},
): Promise<PaginatedResponse<TaskAssignment>> => {
  try {
    const response = await api.get<PaginatedResponse<TaskAssignment>>(
      "/tasks",
      { params },
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getMyTasks = async (
  status?: string,
): Promise<TaskAssignment[]> => {
  try {
    const response = await api.get<TaskAssignment[]>("/tasks/mine", {
      params: status ? { status } : undefined,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createTask = async (
  data: Record<string, unknown>,
): Promise<TaskAssignment> => {
  try {
    const response = await api.post<TaskAssignment>("/tasks", data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const completeTask = async (id: string): Promise<TaskAssignment> => {
  try {
    const response = await api.patch<TaskAssignment>(`/tasks/${id}/complete`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateTask = async (
  id: string,
  data: Record<string, unknown>,
): Promise<TaskAssignment> => {
  try {
    const response = await api.patch<TaskAssignment>(`/tasks/${id}`, data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    await api.delete(`/tasks/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getPlans = async (
  params: PaginationParams & {
    type?: string;
    from?: string;
    to?: string;
    status?: string;
  } = {},
): Promise<PaginatedResponse<Plan>> => {
  try {
    const response = await api.get<PaginatedResponse<Plan>>("/plans", {
      params,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getPlanById = async (id: string): Promise<Plan> => {
  try {
    const response = await api.get<Plan>(`/plans/${id}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createPlan = async (
  data: Record<string, unknown>,
): Promise<Plan> => {
  try {
    const response = await api.post<Plan>("/plans", data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createPlansBulk = async (
  items: Record<string, unknown>[],
): Promise<BulkCreateResult> => {
  try {
    const response = await api.post<BulkCreateResult>("/plans/bulk", {
      items,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updatePlan = async (
  id: string,
  data: Record<string, unknown>,
): Promise<Plan> => {
  try {
    const response = await api.patch<Plan>(`/plans/${id}`, data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deletePlan = async (id: string): Promise<void> => {
  try {
    await api.delete(`/plans/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getFamilyStats = async (): Promise<FamilyStats> => {
  try {
    const response = await api.get<FamilyStats>("/families/stats");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getFamilies = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<Family>> => {
  try {
    const response = await api.get<PaginatedResponse<Family>>("/families", {
      params,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getFamilyById = async (id: string): Promise<Family> => {
  try {
    const response = await api.get<Family>(`/families/${id}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getFamilyByMember = async (
  memberId: string,
): Promise<Family | null> => {
  try {
    const response = await api.get<{ family: Family | null }>(
      `/families/by-member/${memberId}`,
    );
    return response.data?.family ?? null;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createFamily = async (
  data: Record<string, unknown>,
): Promise<Family> => {
  try {
    const response = await api.post<Family>("/families", data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateFamily = async (
  id: string,
  data: Record<string, unknown>,
): Promise<Family> => {
  try {
    const response = await api.patch<Family>(`/families/${id}`, data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteFamily = async (id: string): Promise<void> => {
  try {
    await api.delete(`/families/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const addFamilyChild = async (
  familyId: string,
  data: { name: string; age?: number; date_of_birth?: string },
): Promise<FamilyChild> => {
  try {
    const response = await api.post<FamilyChild>(
      `/families/${familyId}/children`,
      data,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateFamilyChild = async (
  familyId: string,
  childId: string,
  data: Record<string, unknown>,
): Promise<FamilyChild> => {
  try {
    const response = await api.patch<FamilyChild>(
      `/families/${familyId}/children/${childId}`,
      data,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteFamilyChild = async (
  familyId: string,
  childId: string,
): Promise<void> => {
  try {
    await api.delete(`/families/${familyId}/children/${childId}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getRoles = async (): Promise<Role[]> => {
  try {
    const response = await api.get<Role[]>("/access/roles");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getRole = async (id: string): Promise<Role> => {
  try {
    const response = await api.get<Role>(`/access/roles/${id}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createRole = async (data: {
  key: string;
  name: string;
  description?: string;
  permissionSlugs: string[];
}): Promise<Role> => {
  try {
    const response = await api.post<Role>("/access/roles", data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateRole = async (
  id: string,
  data: { name?: string; description?: string; permissionSlugs?: string[] },
): Promise<Role> => {
  try {
    const response = await api.patch<Role>(`/access/roles/${id}`, data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteRole = async (id: string): Promise<void> => {
  try {
    await api.delete(`/access/roles/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getPermissions = async (): Promise<Permission[]> => {
  try {
    const response = await api.get<Permission[]>("/access/permissions");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getPermissionsGrouped = async (): Promise<
  Record<string, Permission[]>
> => {
  try {
    const response = await api.get<Record<string, Permission[]>>(
      "/access/permissions/grouped",
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

// Locations
export const getLocations = async (status?: string): Promise<Location[]> => {
  try {
    const response = await api.get<Location[]>("/locations", {
      params: { status },
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const createLocation = async (
  data: Record<string, unknown>,
): Promise<Location> => {
  try {
    const response = await api.post<Location>("/locations", data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updateLocation = async (
  id: string,
  data: Record<string, unknown>,
): Promise<Location> => {
  try {
    const response = await api.patch<Location>(`/locations/${id}`, data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

// Website CMS
export const getPageContent = async (slug: string): Promise<PageContent> => {
  try {
    const response = await api.get<PageContent>(`/website/pages/${slug}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const updatePageContent = async (
  slug: string,
  content: unknown,
): Promise<PageContent> => {
  try {
    const response = await api.patch<PageContent>(
      `/website/pages/${slug}`,
      content,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getLandingContent = async (): Promise<PageContent> =>
  getPageContent("landing");

export const updateLandingContent = async (
  content: unknown,
): Promise<PageContent> => updatePageContent("landing", content);

export interface ContactRequestPayload {
  full_name: string;
  phone: string;
  email?: string;
  category?: "prayer" | "cell" | "baptism" | "counseling" | "chms" | "general";
  message: string;
  is_confidential?: boolean;
}

export interface ContactRequestResponse {
  success: boolean;
  message: string;
  id: string;
}

export const submitContactRequest = async (
  data: ContactRequestPayload,
): Promise<ContactRequestResponse> => {
  try {
    const response = await api.post<ContactRequestResponse>(
      "/website/contact-requests",
      data,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export default api;

export interface NotificationListResponse {
  items: Array<{
    id: string;
    kind: string;
    severity: string;
    title: string;
    message: string;
    href?: string | null;
    read_at?: string | null;
    created_at: string;
  }>;
  unreadCount: number;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  enabled: boolean;
  kinds: Record<string, boolean>;
}

export const getNotifications = async (): Promise<NotificationListResponse> => {
  try {
    const response = await api.get<NotificationListResponse>("/notifications");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const markNotificationRead = async (id: string): Promise<void> => {
  try {
    await api.patch(`/notifications/${id}/read`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const markAllNotificationsRead = async (): Promise<void> => {
  try {
    await api.patch("/notifications/read-all");
  } catch (error) {
    throw toApiError(error);
  }
};

export const dismissNotification = async (id: string): Promise<void> => {
  try {
    await api.patch(`/notifications/${id}/dismiss`);
  } catch (error) {
    throw toApiError(error);
  }
};

export const getNotificationPreferences =
  async (): Promise<NotificationPreferences> => {
    try {
      const response = await api.get<NotificationPreferences>(
        "/notifications/preferences",
      );
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  };

export const updateNotificationPreferences = async (data: {
  enabled?: boolean;
  kinds?: Record<string, boolean>;
}): Promise<NotificationPreferences> => {
  try {
    const response = await api.patch<NotificationPreferences>(
      "/notifications/preferences",
      data,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export function subscribeNotificationStream(
  onEvent: (event: { type: string; notification?: unknown }) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const token = localStorage.getItem("token");
  if (!token) return () => {};

  let es: EventSource | null = null;
  let retryMs = 1000;
  let closed = false;

  const connect = () => {
    if (closed) return;
    const url = `${API_BASE_URL}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;
    es = new EventSource(url);

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onEvent(data);
        retryMs = 1000;
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es?.close();
      es = null;
      if (!closed) {
        setTimeout(connect, retryMs);
        retryMs = Math.min(retryMs * 2, 30000);
      }
    };
  };

  connect();

  return () => {
    closed = true;
    es?.close();
  };
}
