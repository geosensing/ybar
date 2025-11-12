export interface User {
  id: number;
  email: string;
  role: 'admin' | 'worker';
  name: string;
  phone?: string;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Job {
  id: number;
  client_id?: number;
  title: string;
  description: string;
  pay_per_task: number;
  n_tasks: number;
  n_tasks_per_worker_allowed: number;
  location?: string;
  location_restrictions?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  image_url?: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  available_tasks?: number;
  total_tasks?: number;
  assigned_tasks?: number;
  submitted_tasks?: number;
  approved_tasks?: number;
}

export interface Task {
  id: number;
  job_id: number;
  worker_id?: number;
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  status: 'available' | 'assigned' | 'submitted' | 'approved' | 'rejected';
  assigned_at?: string;
  submitted_at?: string;
  reviewed_at?: string;
  submission_data?: string;
  reviewer_notes?: string;
  created_at: string;
  updated_at: string;
  job_title?: string;
  job_description?: string;
  pay_per_task?: number;
  worker_name?: string;
  worker_email?: string;
  file_count?: number;
  files?: TaskFile[];
}

export interface TaskFile {
  id: number;
  task_id: number;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface Payment {
  id: number;
  worker_id: number;
  task_id: number;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at?: string;
  created_at: string;
  worker_name?: string;
  worker_email?: string;
  task_title?: string;
  job_title?: string;
}

export interface PaymentStats {
  total_payments: number;
  total_amount: number;
  pending_amount: number;
  paid_amount: number;
  pending_count: number;
  paid_count: number;
}

export interface Client {
  id: number;
  name: string;
  website?: string;
  contact?: string;
  location?: string;
  notes?: string;
  created_at: string;
}
