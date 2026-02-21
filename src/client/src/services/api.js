import axios from 'axios';

// Use a relative base URL when VITE_API_URL is not explicitly set at build time.
// This ensures the built frontend always calls the same server that served it,
// regardless of the hostname/IP (no hardcoded localhost that breaks remote access).
// In development Vite's proxy (/api → http://localhost:3000) handles the forwarding.
const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Auto-refresh on 401
// Auth endpoints should never trigger a token-refresh / page-redirect loop.
// If /auth/login itself returns 401 (wrong credentials) we must let the error
// propagate to the caller (Login.jsx) so it can display the error message.
// /auth/me is called by I18nContext on every mount (including the login page
// when unauthenticated); intercepting its 401 with a page redirect would cause
// an infinite reload loop on the login page.
const AUTH_SKIP_REFRESH = ['/auth/login', '/auth/refresh', '/auth/2fa', '/auth/me'];

api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const isAuthEndpoint = AUTH_SKIP_REFRESH.some(p => url.includes(p));
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        const { access_token: accessToken } = res.data.data || res.data;
        if (!accessToken || typeof accessToken !== 'string') {
          throw new Error('Invalid refresh response: no access_token returned');
        }
        localStorage.setItem('accessToken', accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
