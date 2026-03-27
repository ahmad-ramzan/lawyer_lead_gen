import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      const role = localStorage.getItem('role');
      // Only auto-clear for attorney/admin — client portal handles 401 inline
      if (role === 'attorney' || role === 'admin') {
        localStorage.clear();
        document.cookie = 'access_token=; Max-Age=0; path=/';
        document.cookie = 'role=; Max-Age=0; path=/';
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;
