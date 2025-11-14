import axios from 'axios';

export const authApi = axios.create({
  baseURL: process.env.REACT_APP_AUTH_API,
  withCredentials: true // needed for HTTP-only cookie
});

// If auth expires, bounce to /login
authApi.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401) window.location.assign('/login');
    return Promise.reject(err);
  }
);