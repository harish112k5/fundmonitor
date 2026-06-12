import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://fundmonitor.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle standardized responses and 401/403 globally
API.interceptors.response.use(
  res => {
    // Automatically unwrap the standard { success: true, data: ... } format
    // so frontend components don't have to be updated everywhere
    if (res.data && res.data.success === true && res.data.data !== undefined) {
      res.data = res.data.data;
    }
    return res;
  },
  err => {
    const url = err.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.clear();
      window.location.href = '/login';
    }
    if (err.response?.data?.code === 'ACCOUNT_BLOCKED') {
      localStorage.clear();
      window.location.href = '/login';
    }

    // Standardize error message throwing
    if (err.response?.data && err.response.data.success === false && err.response.data.message) {
      err.message = err.response.data.message;
    }

    return Promise.reject(err);
  }
);

export default API;
