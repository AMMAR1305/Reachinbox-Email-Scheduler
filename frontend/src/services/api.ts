import axios from 'axios';

// baseURL is always '/api'.
// - In local dev: Vite's proxy (vite.config.ts) forwards /api → http://localhost:5000
// - In production (Vercel): vercel.json rewrites /api/* → https://civicconnect-dibt.onrender.com/api/*
// No environment variable is required.
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
