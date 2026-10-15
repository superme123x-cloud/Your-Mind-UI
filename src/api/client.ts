import axios from 'axios';

// الرابط المباشر للباك إند أونلاين
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

// 2. المهام (Tasks)
export const tasksApi = {
  getAll: () => apiClient.get('/tasks'),
  create: (data: any) => apiClient.post('/tasks', data),
  update: (id: string | number, data: any) => apiClient.put(`/tasks/${id}`, data),
  delete: (id: string | number) => apiClient.delete(`/tasks/${id}`),
};
export const tasks = tasksApi; // توافقاً مع أي استدعاء آخر

// 3. المشاريع (Projects)
export const projectsApi = {
  getAll: () => apiClient.get('/projects'),
  create: (data: any) => apiClient.post('/projects', data),
  delete: (id: string | number) => apiClient.delete(`/projects/${id}`),
};
export const projects = projectsApi;

// 4. الإحصائيات (Stats)
export const statsApi = {
  getStats: () => apiClient.get('/stats'),
};
export const stats = statsApi;

// 5. المساعد الذكي / الـ AI
export const aiApi = {
  chat: (message: string) => apiClient.post('/ai/chat', { message }),
};
export const ai = aiApi;

// 6. المؤقت / البومودورو (Pomodoro / Timer)
export const pomodoroApi = {
  saveSession: (data: any) => apiClient.post('/pomodoro', data),
  getSessions: () => apiClient.get('/pomodoro'),
};
export const pomodoro = pomodoroApi;

export default apiClient;
