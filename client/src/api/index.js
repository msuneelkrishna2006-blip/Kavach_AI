import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('kavach_token');
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
      sessionStorage.removeItem('kavach_token');
      if (window.location.pathname.startsWith('/app')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
  changePassword: (data) => api.patch('/api/auth/password', data),
};

// User API
export const userApi = {
  updateProfile: (data) => api.patch('/api/users/me', data),
  exportData: () => api.get('/api/users/me/export'),
  deleteAccount: (data) => api.delete('/api/users/me', { data }),
};

// Scan API
export const scanApi = {
  analyze: (data) => api.post('/api/scans/analyze', data),
  redactPreview: (data) => api.post('/api/privacy/redact', data),
  getScans: (params) => api.get('/api/scans', { params }),
  getScan: (id) => api.get(`/api/scans/${id}`),
  getReport: (id, format) => api.get(`/api/scans/${id}/report`, { params: { format } }),
  submitFeedback: (id, data) => api.post(`/api/scans/${id}/feedback`, data),
  deleteScan: (id) => api.delete(`/api/scans/${id}`),
  clearAll: () => api.delete('/api/scans'),
};

// Demo API
export const demoApi = {
  analyze: (data) => api.post('/api/demo/analyze', data),
};

// URL API
export const urlApi = {
  inspect: (data) => api.post('/api/url/inspect', data),
};

// Radar API
export const radarApi = {
  getSummary: (range) => api.get('/api/radar/summary', { params: { range } }),
  getCampaigns: () => api.get('/api/radar/campaigns'),
};

// Dashboard API
export const dashboardApi = {
  getSummary: () => api.get('/api/dashboard/summary'),
};

// Drills API
export const drillsApi = {
  getNext: () => api.get('/api/drills/next'),
  submitAnswer: (id, data) => api.post(`/api/drills/${id}/answer`, data),
  getStats: () => api.get('/api/drills/stats'),
};

// Playbook API
export const playbookApi = {
  get: () => api.get('/api/playbook'),
};

// Admin API
export const adminApi = {
  getAnalytics: () => api.get('/api/admin/analytics'),
  getCalibration: () => api.get('/api/admin/calibration'),
  generateBriefing: () => api.post('/api/admin/briefing'),
  getUsers: () => api.get('/api/admin/users'),
  updateUserRole: (id, data) => api.patch(`/api/admin/users/${id}/role`, data),
  getAuditLogs: (params) => api.get('/api/admin/audit', { params }),
};

// Health API
export const healthApi = {
  check: () => api.get('/api/health'),
};

export default api;
