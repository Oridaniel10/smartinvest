import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL_SERVER || 'http://127.0.0.1:5000';

const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient; 