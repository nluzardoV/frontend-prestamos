import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://sistema-prestamos-pedro.onrender.com'

});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      localStorage.removeItem('username');
      window.location.reload(); // Force reload to trigger re-render and go to login
    }
    return Promise.reject(error);
  }
);

export default api;