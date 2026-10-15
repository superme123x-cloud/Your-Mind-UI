import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lifeos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lifeos_token');
      localStorage.removeItem('lifeos_username');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ Auth ============
export const authApi = {
  register: (data: { username: string; password: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post('/api/auth/login', data),
};

// ============ Projects ============
export const projectsApi = {
  list: () => api.get('/api/projects'),
  create: (data: { name: string; categoryCode: string; targetWeek: number | null }) =>
    api.post('/api/projects', data),
  update: (id: number, data: { name: string; categoryCode: string; targetWeek: number | null }) =>
    api.put(`/api/projects/${id}`, data),
  delete: (id: number) => api.delete(`/api/projects/${id}`),
};

// ============ Tasks ============
export const tasksApi = {
  today: () => api.get('/api/tasks/today'),
  create: (data: { title: string; description?: string | null; projectId?: number | null }) =>
    api.post('/api/tasks', data),
  update: (id: number, data: { title: string; description?: string | null; projectId?: number | null }) =>
    api.put(`/api/tasks/${id}`, data),
  toggle: (id: number) => api.post(`/api/tasks/${id}/toggle`),
  delete: (id: number) => api.delete(`/api/tasks/${id}`),
  reorder: (taskIds: number[]) => api.post('/api/tasks/reorder', taskIds),
};

// ============ Pomodoro ============
export const pomodoroApi = {
  complete: (data: {
    taskId?: number | null;
    projectId?: number | null;
    activityType?: string;
    durationMinutes: number;
  }) => api.post('/api/pomodoro', data),
  recent: (take = 20) => api.get(`/api/pomodoro/recent?take=${take}`),
};

// ============ Stats ============
export const statsApi = {
  weekly: () => api.get('/api/stats/weekly'),
  summary: () => api.get('/api/stats/summary'),
  distribution: () => api.get('/api/stats/distribution'),
};

// ============ AI ============
export const aiApi = {
  extract: (data: { text: string; save: boolean }) =>
    api.post('/api/ai/extract-tasks', data),
  
};