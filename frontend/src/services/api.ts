import axios from 'axios';

// In production (Vercel), VITE_API_URL is set to the Render backend URL.
// In local dev, it is not set so we fall back to '/api' which Vite's proxy
// forwards to http://localhost:5000.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const api = axios.create({
  baseURL: BASE_URL,
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
