import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for global response handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if we are checking current auth state
      if (!error.config?.url?.includes('/auth/me')) {
        console.warn('[API] 401 Unauthorized detected. Redirection may occur.');
      }
    }
    return Promise.reject(error);
  }
);
