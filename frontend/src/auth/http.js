import axios from 'axios';

let memoryToken = null;
export const setMemoryToken = (t) => { memoryToken = t; };

export const makeServiceApi = (baseURL) => {
  const api = axios.create({ baseURL });
  api.interceptors.request.use((config) => {
    if (memoryToken) config.headers.Authorization = `Bearer ${memoryToken}`;
    return config;
  });
  api.interceptors.response.use(
    r => r,
    err => {
      if (err?.response?.status === 401) window.location.assign('/login');
      return Promise.reject(err);
    }
  );
  return api;
};

// Examples you can use elsewhere:
export const adminApi  = makeServiceApi(process.env.REACT_APP_ADMIN_API);
export const clientApi = makeServiceApi(process.env.REACT_APP_CLIENT_API);