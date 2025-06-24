import axios from 'axios';

// Get the base URL from environment variables, with a fallback for local development
const BASE_URL = import.meta.env.VITE_BASE_URL_SERVER || 'http://localhost:5000';


/**
 * Create an Axios instance with a predefined base URL.
 * This instance can be used for all API calls throughout the application.
 */
const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Add a request interceptor to the Axios instance to send the token 
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Add the token to the Authorization header using the Bearer scheme.
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // If there's an error during the request setup, reject the promise.
    return Promise.reject(error);
  }
);

export default apiClient; 