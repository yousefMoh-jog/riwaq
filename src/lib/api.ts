import axios, { type AxiosError } from 'axios';

export { getApiErrorMessage } from './utils';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8001').trim();

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError<{ message?: string; error?: string; messageAr?: string }>) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.replace('/login');
    }
    const message =
      err.response?.data?.messageAr ??
      err.response?.data?.message ??
      err.response?.data?.error ??
      err.message ??
      'حدث خطأ';
    return Promise.reject(new Error(message));
  }
);
