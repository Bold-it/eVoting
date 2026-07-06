import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', // Dynamic backend URL
});

// Add a request interceptor to inject the JWT token
api.interceptors.request.use((config) => {
  const isAdminRoute = config.url?.startsWith('/admin') || config.url?.startsWith('/auth/admin');
  const isVoterRoute = config.url?.startsWith('/voter') || config.url?.startsWith('/auth/voter');

  if (isAdminRoute) {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }

  if (isVoterRoute) {
    try {
      const raw = sessionStorage.getItem('htu-voting-state');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.accessToken) {
          config.headers.Authorization = `Bearer ${parsed.accessToken}`;
        }
      }
    } catch {}
    return config;
  }

  // Fallback if neither matches but a token exists
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
