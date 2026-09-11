import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({ baseURL: API_BASE });

// Normalizes error messages so components can just display err.message
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default client;
export { API_BASE };
