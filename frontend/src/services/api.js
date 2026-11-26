import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10_000,
  withCredentials: true,
});

export const payload = response => response.data.data;
export const requestError = error => error.response?.data?.message || error.message || 'Something went wrong.';
