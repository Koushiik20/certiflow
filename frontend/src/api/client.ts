import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL || '';
  return url.endsWith('/api') ? url.slice(0, -4) : url;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('certiflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      // localStorage.removeItem('certiflow_token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

