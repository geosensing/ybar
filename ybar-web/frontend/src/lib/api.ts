import axios from 'axios';
import type { AuthResponse, User, Job, Task, Payment, PaymentStats } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  register: async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: 'admin' | 'worker';
  }): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', userData);
    return data;
  },

  me: async (): Promise<{ user: User }> => {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data;
  },
};

// Jobs API
export const jobsAPI = {
  getAll: async (): Promise<{ jobs: Job[] }> => {
    const { data } = await api.get('/jobs');
    return data;
  },

  getById: async (id: number): Promise<{ job: Job }> => {
    const { data } = await api.get(`/jobs/${id}`);
    return data;
  },

  create: async (jobData: Partial<Job>): Promise<{ job: Job }> => {
    const { data } = await api.post('/jobs', jobData);
    return data;
  },

  update: async (id: number, jobData: Partial<Job>): Promise<{ job: Job }> => {
    const { data } = await api.put(`/jobs/${id}`, jobData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/jobs/${id}`);
  },

  getStats: async (id: number): Promise<{ stats: any }> => {
    const { data } = await api.get(`/jobs/${id}/stats`);
    return data;
  },
};

// Tasks API
export const tasksAPI = {
  getByJob: async (jobId: number): Promise<{ tasks: Task[] }> => {
    const { data } = await api.get(`/tasks/job/${jobId}`);
    return data;
  },

  getAvailable: async (): Promise<{ tasks: Task[] }> => {
    const { data } = await api.get('/tasks/available');
    return data;
  },

  getMyTasks: async (): Promise<{ tasks: Task[] }> => {
    const { data } = await api.get('/tasks/my-tasks');
    return data;
  },

  getById: async (id: number): Promise<{ task: Task }> => {
    const { data } = await api.get(`/tasks/${id}`);
    return data;
  },

  create: async (taskData: Partial<Task>): Promise<{ task: Task }> => {
    const { data } = await api.post('/tasks', taskData);
    return data;
  },

  assign: async (id: number): Promise<{ task: Task }> => {
    const { data } = await api.post(`/tasks/${id}/assign`);
    return data;
  },

  submit: async (id: number, formData: FormData): Promise<{ task: Task }> => {
    const { data } = await api.post(`/tasks/${id}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  review: async (id: number, status: 'approved' | 'rejected', notes?: string): Promise<{ task: Task }> => {
    const { data } = await api.post(`/tasks/${id}/review`, { status, reviewer_notes: notes });
    return data;
  },

  getPendingReview: async (): Promise<{ tasks: Task[] }> => {
    const { data } = await api.get('/tasks/pending/review');
    return data;
  },
};

// Payments API
export const paymentsAPI = {
  getMyPayments: async (): Promise<{ payments: Payment[] }> => {
    const { data } = await api.get('/payments/my-payments');
    return data;
  },

  getAll: async (status?: string): Promise<{ payments: Payment[] }> => {
    const { data } = await api.get('/payments', { params: { status } });
    return data;
  },

  markPaid: async (id: number): Promise<{ payment: Payment }> => {
    const { data } = await api.post(`/payments/${id}/pay`);
    return data;
  },

  getStats: async (): Promise<{ stats: PaymentStats }> => {
    const { data } = await api.get('/payments/stats/summary');
    return data;
  },
};

export default api;
