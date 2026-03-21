import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Gửi cookie session cho OAuth2
});

// Interceptor: redirect về /login nếu 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Backend OAuth2 login page
      window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    }
    return Promise.reject(error);
  }
);

export default api;
