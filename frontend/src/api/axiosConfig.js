import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:8080`;

// Interceptor: redirect về /login nếu 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/oauth2/authorization/google';
    }
    return Promise.reject(error);
  }
);

export default api;
