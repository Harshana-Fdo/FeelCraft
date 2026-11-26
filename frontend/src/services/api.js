import axios from 'axios';

const options = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10_000,
  withCredentials: true,
};

export const api = axios.create(options);
export const sessionApi = axios.create({
  ...options,
  baseURL: import.meta.env.VITE_AUTH_API_BASE_URL || options.baseURL,
});

export const payload = response => response.data.data;
export const requestError = error => error.response?.data?.message || error.message || 'Something went wrong.';
