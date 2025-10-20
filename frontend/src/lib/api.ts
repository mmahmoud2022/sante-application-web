/**
 * API Client
 * Centralized API client for communicating with the backend
 */

import axios, { AxiosHeaders } from 'axios';
import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

const normalizeBaseUrl = (url?: string | null) => {
  if (!url) {
    return undefined;
  }
  return url.replace(/\/+$/, '');
};

const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;

const envBrowserBaseUrl = normalizeBaseUrl(runtimeEnv?.NEXT_PUBLIC_API_URL);
const envServerBaseUrl = normalizeBaseUrl(runtimeEnv?.NEXT_INTERNAL_API_URL);

const resolveBaseUrl = () => {
  if (typeof window === 'undefined') {
    return envServerBaseUrl || envBrowserBaseUrl || 'http://localhost:8000';
  }

  if (envBrowserBaseUrl) {
    return envBrowserBaseUrl;
  }

  return '';
};

const resolvedBaseUrl = resolveBaseUrl();
const apiBaseUrl = resolvedBaseUrl ? `${resolvedBaseUrl}/api/v1` : '/api/v1';

const buildApiUrl = (path: string) => {
  const normalizedBase = apiBaseUrl.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
};

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers = config.headers ?? new AxiosHeaders();
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          try {
            const response = await axios.post(buildApiUrl('/auth/refresh'), {
              refresh_token: refreshToken,
            });

            const { access_token } = response.data;
            localStorage.setItem('access_token', access_token);

            // Retry the original request with new token
            originalRequest.headers = originalRequest.headers ?? new AxiosHeaders();
            originalRequest.headers.set('Authorization', `Bearer ${access_token}`);
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
const api = {
  // Authentication
  auth: {
    login: async (email: string, password: string, rememberMe = false) => {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      formData.append('remember_me', rememberMe ? 'true' : 'false');
      
      return axiosInstance.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    },
    
    register: async (data: any) => {
      return axiosInstance.post('/auth/register', data);
    },
    
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    },
    
    refresh: async (refreshToken: string) => {
      return axiosInstance.post('/auth/refresh', { refresh_token: refreshToken });
    },
    
    requestPasswordReset: async (email: string) => {
      return axiosInstance.post('/auth/request-password-reset', { email });
    },
    
    validateResetToken: async (token: string) => {
      return axiosInstance.post('/auth/validate-reset-token', { token });
    },
    
    resetPassword: async (token: string, new_password: string) => {
      return axiosInstance.post('/auth/reset-password', { token, new_password });
    },
    
    verifyEmail: async (token: string) => {
      return axiosInstance.post('/auth/verify-email', { token });
    },
    
    resendVerificationEmail: async () => {
      return axiosInstance.post('/auth/resend-verification');
    },
  },

  // Users
  users: {
    me: async () => {
      return axiosInstance.get('/users/me');
    },
    
    update: async (idOrData: number | any, data?: any) => {
      // Support both update(data) for current user and update(id, data) for admin
      if (typeof idOrData === 'number' && data) {
        return axiosInstance.put(`/users/${idOrData}`, data);
      } else {
        return axiosInstance.put('/users/me', idOrData);
      }
    },
    
    list: async (params?: any) => {
      return axiosInstance.get('/users/', { params });
    },
    
    doctors: async (params?: any) => {
      return axiosInstance.get('/users/doctors', { params });
    },
    
    getDoctor: async (id: number) => {
      return axiosInstance.get(`/users/doctors/${id}`);
    },
    
    delete: async (id: number) => {
      return axiosInstance.delete(`/users/${id}`);
    },
    
    verify: async (id: number) => {
      return axiosInstance.post(`/users/${id}/verify`);
    },
    
    stats: async () => {
      return axiosInstance.get('/users/stats/overview');
    },
    
    getTwoFactorStatus: async () => {
      return axiosInstance.get('/users/me/2fa/status');
    },
    
    sendTwoFactorCode: async (data: any) => {
      return axiosInstance.post('/users/me/2fa/send-code', data);
    },
    
    generateTwoFactorSecret: async () => {
      return axiosInstance.post('/users/me/2fa/generate-secret');
    },
    
    enableTwoFactor: async (data: any) => {
      return axiosInstance.post('/users/me/2fa/enable', data);
    },
    
    disableTwoFactor: async () => {
      return axiosInstance.post('/users/me/2fa/disable');
    },
  },

  // Appointments
  appointments: {
    list: async (params?: any) => {
      return axiosInstance.get('/appointments/', { params });
    },
    
    get: async (id: number) => {
      return axiosInstance.get(`/appointments/${id}`);
    },
    
    create: async (data: any) => {
      return axiosInstance.post('/appointments/', data);
    },
    
    update: async (id: number, data: any) => {
      return axiosInstance.put(`/appointments/${id}`, data);
    },
    
    cancel: async (id: number, reason?: string) => {
      return axiosInstance.patch(`/appointments/${id}/cancel`, { 
        cancellation_reason: reason 
      });
    },
    
    confirm: async (id: number) => {
      return axiosInstance.patch(`/appointments/${id}/confirm`);
    },
    
    complete: async (id: number, data?: any) => {
      return axiosInstance.patch(`/appointments/${id}/complete`, data);
    },
    
    getAvailableSlots: async (doctorId: number, date: string) => {
      return axiosInstance.get(`/appointments/available-slots`, {
        params: { doctor_id: doctorId, date }
      });
    },
    
    stats: async () => {
      return axiosInstance.get('/appointments/stats/overview');
    },
  },

  // Prescriptions
  prescriptions: {
    list: async (params?: any) => {
      return axiosInstance.get('/prescriptions/', { params });
    },
    
    get: async (id: number) => {
      return axiosInstance.get(`/prescriptions/${id}`);
    },
    
    create: async (data: any) => {
      return axiosInstance.post('/prescriptions/', data);
    },
    
    update: async (id: number, data: any) => {
      return axiosInstance.put(`/prescriptions/${id}`, data);
    },
    
    renew: async (id: number) => {
      return axiosInstance.post(`/prescriptions/${id}/renew`);
    },
    
    cancel: async (id: number) => {
      return axiosInstance.patch(`/prescriptions/${id}/cancel`);
    },
  },

  // Medical Records
  medicalRecords: {
    list: async (params?: any) => {
      return axiosInstance.get('/medical-records/', { params });
    },
    
    get: async (id: number) => {
      return axiosInstance.get(`/medical-records/${id}`);
    },
    
    getByPatient: async (patientId: number) => {
      return axiosInstance.get(`/medical-records/patient/${patientId}`);
    },
    
    create: async (data: any) => {
      return axiosInstance.post('/medical-records/', data);
    },
    
    update: async (id: number, data: any) => {
      return axiosInstance.put(`/medical-records/${id}`, data);
    },
  },

  // Documents
  documents: {
    list: async (params?: any) => {
      return axiosInstance.get('/documents/', { params });
    },
    
    get: async (id: number) => {
      return axiosInstance.get(`/documents/${id}`);
    },
    
    upload: async (file: File, data: any) => {
      const formData = new FormData();
      formData.append('file', file);
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      
      return axiosInstance.post('/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    
    delete: async (id: number) => {
      return axiosInstance.delete(`/documents/${id}`);
    },
    
    download: async (id: number) => {
      return axiosInstance.get(`/documents/${id}/download`, {
        responseType: 'blob',
      });
    },
  },

  // Notifications
  notifications: {
    list: async (params?: any) => {
      return axiosInstance.get('/notifications/', { params });
    },
    
    markAsRead: async (id: number) => {
      return axiosInstance.patch(`/notifications/${id}/read`);
    },
    
    markAllAsRead: async () => {
      return axiosInstance.post('/notifications/mark-all-read');
    },
  },

  // Reviews
  reviews: {
    list: async (params?: any) => {
      return axiosInstance.get('/reviews/', { params });
    },
    
    getByDoctor: async (doctorId: number, params?: any) => {
      return axiosInstance.get(`/reviews/doctor/${doctorId}`, { params });
    },
    
    create: async (data: any) => {
      return axiosInstance.post('/reviews/', data);
    },
    
    update: async (id: number, data: any) => {
      return axiosInstance.put(`/reviews/${id}`, data);
    },
    
    delete: async (id: number) => {
      return axiosInstance.delete(`/reviews/${id}`);
    },
  },

  // Schedules
  schedules: {
    list: async (params?: any) => {
      return axiosInstance.get('/schedules/', { params });
    },
    
    getByDoctor: async (doctorId: number) => {
      return axiosInstance.get(`/schedules/doctor/${doctorId}`);
    },
    
    create: async (data: any) => {
      return axiosInstance.post('/schedules/', data);
    },
    
    update: async (id: number, data: any) => {
      return axiosInstance.put(`/schedules/${id}`, data);
    },
    
    delete: async (id: number) => {
      return axiosInstance.delete(`/schedules/${id}`);
    },
  },

  // Payments
  payments: {
    list: async (params?: any) => {
      return axiosInstance.get('/payments/', { params });
    },
    
    get: async (id: number) => {
      return axiosInstance.get(`/payments/${id}`);
    },
    
    create: async (data: any) => {
      return axiosInstance.post('/payments/', data);
    },
    
    processPayment: async (id: number, paymentMethod: string) => {
      return axiosInstance.post(`/payments/${id}/process`, { payment_method: paymentMethod });
    },
    
    refund: async (id: number, amount?: number) => {
      return axiosInstance.post(`/payments/${id}/refund`, { amount });
    },
  },
};

export default api;
