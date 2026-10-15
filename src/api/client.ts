import axios from 'axios';

const API_BASE_URL = 'https://yourmind.runasp.net/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor لإضافة الـ Token تلقائياً
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lifeos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor لمعالجة انتهاء الجلسة (401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('lifeos_token');
      localStorage.removeItem('lifeos_username');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 1. نظام التوثيق (Auth)
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  register: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/register', credentials),
};

// 2. المهام (Tasks) - متوافقة مع (list, today, toggle, reorder, create, update, delete)
export const tasksApi = {
  getAll: () => apiClient.get('/tasks'),
  list: () => apiClient.get('/tasks'),
  today: () => apiClient.get('/tasks/today'),
  create: (data: any) => apiClient.post('/tasks', data),
  update: (id: string | number, data: any) => apiClient.put(`/tasks/${id}`, data),
  toggle: (id: string | number) => apiClient.patch(`/tasks/${id}/toggle`),
  reorder: (data: any) => apiClient.post('/tasks/reorder', data),
  delete: (id: string | number) => apiClient.delete(`/tasks/${id}`),
};
export const tasks = tasksApi;

// 3. المشاريع (Projects) - متوافقة مع (list, getAll, update, create, delete)
export const projectsApi = {
  getAll: () => apiClient.get('/projects'),
  list: () => apiClient.get('/projects'),
  create: (data: any) => apiClient.post('/projects', data),
  update: (id: string | number, data: any) => apiClient.put(`/projects/${id}`, data),
  delete: (id: string | number) => apiClient.delete(`/projects/${id}`),
};
export const projects = projectsApi;

// 4. الإحصائيات (Stats) - متوافقة مع (getStats, weekly, summary, distribution)
export const statsApi = {
  getStats: () => apiClient.get('/stats'),
  weekly: () => apiClient.get('/stats/weekly'),
  summary: () => apiClient.get('/stats/summary'),
  distribution: () => apiClient.get('/stats/distribution'),
};
export const stats = statsApi;

// 5. المساعد الذكي / الـ AI - متوافقة مع (chat, extract)
export const aiApi = {
  chat: (message: string) => apiClient.post('/ai/chat', { message }),
  extract: (data: any) => apiClient.post('/ai/extract', data),
};
export const ai = aiApi;

// 6. المؤقت / البومودورو - متوافقة مع (list, today, saveSession, complete)
export const pomodoroApi = {
  getAll: () => apiClient.get('/pomodoro'),
  list: () => apiClient.get('/pomodoro'),
  today: () => apiClient.get('/pomodoro/today'),
  saveSession: (data: any) => apiClient.post('/pomodoro', data),
  complete: (data: any) => apiClient.post('/pomodoro/complete', data),
};
export const pomodoro = pomodoroApi;

export default apiClient;
