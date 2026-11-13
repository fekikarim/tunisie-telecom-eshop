import axios from 'axios';

export const TOKEN_KEY = 'tt_token';

export const api = axios.create({ baseURL: '/api', timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthCall = url.startsWith('/auth/login') || url.startsWith('/auth/register');
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('tt:session-expired'));
    }
    return Promise.reject(error);
  }
);

/** A readable message from an API error (or a network failure). */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check that the backend is running.';
  return error?.response?.data?.message || fallback;
}

/** Field-level validation errors returned by the API, e.g. { price: '...' }. */
export function getFieldErrors(error) {
  return error?.response?.data?.errors || {};
}

export const imageOrFallback = (url) => url || '/products/placeholder.svg';
