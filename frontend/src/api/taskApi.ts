import axios from 'axios';
import type {
  Task,
  TasksResponse,
  CreateTaskData,
  UpdateTaskData,
  ApiResponse,
} from '../types';

// ─────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  // 120s timeout — AI analysis can take 10-30s
  timeout: 120_000,
});

// ── Response interceptor — normalize error messages ───────────
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as ApiResponse)?.message ??
        error.message ??
        'Network error. Please check your connection.';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// Task API methods
// ─────────────────────────────────────────────────────────────

export const taskApi = {
  /** Create a task and trigger AI analysis (single atomic call) */
  create: async (data: CreateTaskData): Promise<Task> => {
    const res = await api.post<ApiResponse<Task>>('/tasks', data);
    return res.data.data!;
  },

  /** Paginated task list */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<TasksResponse> => {
    const res = await api.get<TasksResponse>('/tasks', { params });
    return res.data;
  },

  /** Single task by ID */
  getById: async (id: string): Promise<Task> => {
    const res = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return res.data.data!;
  },

  /** Update mutable task fields */
  update: async (id: string, data: UpdateTaskData): Promise<Task> => {
    const res = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, data);
    return res.data.data!;
  },

  /** Permanently delete a task */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  /** Re-trigger AI analysis for an existing task */
  analyze: async (id: string): Promise<Task> => {
    const res = await api.post<ApiResponse<Task>>(`/tasks/${id}/analyze`);
    return res.data.data!;
  },
};
