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

export default API;

