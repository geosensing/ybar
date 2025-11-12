import axios from 'axios';
import type { AuthResponse, User, Job, Task, Payment, PaymentStats, Client, Device, PointsBalance, PointsTransaction } from '@/types';

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

  review: async (id: number, status: 'approved' | 'rejected', notes?: string, worker_rating?: number): Promise<{ task: Task }> => {
    const { data } = await api.post(`/tasks/${id}/review`, { status, reviewer_notes: notes, worker_rating });
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

// Profile API
export const profileAPI = {
  get: async (): Promise<{ user: User }> => {
    const { data } = await api.get('/profile');
    return data;
  },

  update: async (userData: Partial<User>): Promise<{ user: User }> => {
    const { data } = await api.put('/profile', userData);
    return data;
  },

  delete: async (password: string): Promise<void> => {
    await api.delete('/profile', { data: { password } });
  },

  changePassword: async (current_password: string, new_password: string): Promise<void> => {
    await api.post('/profile/change-password', { current_password, new_password });
  },
};

// Devices API
export const devicesAPI = {
  getAll: async (): Promise<{ devices: Device[] }> => {
    const { data } = await api.get('/devices');
    return data;
  },

  register: async (deviceData: { device_id: string; device_type?: string; device_name?: string }): Promise<{ device: Device }> => {
    const { data } = await api.post('/devices/register', deviceData);
    return data;
  },

  deregister: async (id: number): Promise<void> => {
    await api.delete(`/devices/${id}`);
  },

  ping: async (id: number): Promise<void> => {
    await api.post(`/devices/${id}/ping`);
  },
};

// Points API
export const pointsAPI = {
  getBalance: async (): Promise<PointsBalance> => {
    const { data } = await api.get('/points/balance');
    return data;
  },

  reimburse: async (): Promise<any> => {
    const { data } = await api.post('/points/reimburse');
    return data;
  },

  getAdminTransactions: async (user_id?: number, transaction_type?: string): Promise<{ transactions: PointsTransaction[] }> => {
    const { data } = await api.get('/points/admin/transactions', { params: { user_id, transaction_type } });
    return data;
  },

  adjustPoints: async (user_id: number, points: number, description?: string): Promise<any> => {
    const { data } = await api.post('/points/admin/adjust', { user_id, points, description });
    return data;
  },
};

// Clients API
export const clientsAPI = {
  getAll: async (): Promise<{ clients: Client[] }> => {
    const { data } = await api.get('/clients');
    return data;
  },

  getById: async (id: number): Promise<{ client: Client }> => {
    const { data } = await api.get(`/clients/${id}`);
    return data;
  },

  create: async (clientData: Partial<Client>): Promise<{ client: Client }> => {
    const { data } = await api.post('/clients', clientData);
    return data;
  },

  update: async (id: number, clientData: Partial<Client>): Promise<{ client: Client }> => {
    const { data } = await api.put(`/clients/${id}`, clientData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};

// Extended Jobs API for CSV upload
export const jobsExtendedAPI = {
  uploadTasks: async (jobId: number, file: File): Promise<{ message: string; created: number; errors?: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/jobs/${jobId}/upload-tasks`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};

export default api;
