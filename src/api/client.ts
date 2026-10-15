import axios from 'axios';

// 1. تحديد الرابط الرئيسي المباشر للباك إند أونلاين
const API_BASE_URL = 'https://yourmind.runasp.net/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor لإضافة الـ Token تلقائياً مع كل طلب
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

// 2. كائن authApi المستخدم في AuthContext
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
    
  register: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/register', credentials),
};

export default apiClient;
