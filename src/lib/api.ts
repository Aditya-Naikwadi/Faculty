import axios from 'axios';
import Cookies from 'js-cookie';

// Backend URL – defaults to local NestJS server during development.
// Set NEXT_PUBLIC_BACKEND_URL in .env.local for production or alternative hosts.
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  // Enable cookie transmission for HttpOnly JWT session cookie.
  withCredentials: true,
});

// Attach CSRF token from the readable cookie to every request.
api.interceptors.request.use((config) => {
  const csrfToken = Cookies.get('csrf_token');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Global response handler – redirect to login on 401 (unauthenticated).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
