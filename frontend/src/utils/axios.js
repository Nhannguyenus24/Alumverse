import axios from 'axios';
import useAuthStore from '../stores/authStore';
import { userFromAccessToken } from './jwt';

const BASE_URL = '/api';

// Exact paths — avoid includes() to prevent substring bypass
const AUTH_WHITELIST = ['/auth/login', '/auth/google-login', '/auth/refresh'];

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Dedicated refresh instance — no interceptors → avoids refresh loops
const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// --- Refresh Token State ---
let isRefreshing = false;
let failedQueue = [];

/**
 * Resolve or reject every request waiting in the queue
 */
const processQueue = (error, token = null) => {
  const queue = [...failedQueue];
  failedQueue = []; // Clear queue before processing to avoid races
  queue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
};

/**
 * Whether the URL is on the auth whitelist (exact match after stripping base URL)
 */
const isAuthWhitelistedURL = (url = '') => {
  // Strip baseURL prefix if present; compare paths only
  const path = url.replace(BASE_URL, '');
  return AUTH_WHITELIST.some(
    (whitelisted) =>
      path === whitelisted || path.startsWith(whitelisted + '?')
  );
};

/**
 * Logs the user out and redirects to login
 */
const forceLogout = () => {
  useAuthStore.getState().reset();
  const currentPath = window.location.pathname;
  if (currentPath !== '/login') {
    window.location.href = '/login';
  }
};

/**
 * Calls refresh-token API and returns the new access token (throws if it fails)
 */
export async function refreshSessionAccessToken() {
  const res = await refreshClient.post('/auth/refresh');
  const newToken = res?.data?.data?.accessToken;

  if (typeof newToken !== 'string' || newToken.length === 0) {
    throw new Error('Invalid access token received from refresh API');
  }

  return newToken;
}

/** Updates token and user in the store from the access JWT (interceptor + useAuth). */
export function syncAuthStoreFromAccessToken(accessToken) {
  useAuthStore.getState().setToken(accessToken);
  const authUser = userFromAccessToken(accessToken);
  if (authUser) useAuthStore.getState().setUser(authUser);
}

// --- Request interceptor: attach Bearer token ---
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response interceptor: 401 handling + refresh ---
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip handling when:
    // - Not 401
    // - Already retried (single retry only)
    // - URL is auth whitelist (login, refresh)
    if (
      error.response?.status !== 401 ||
      originalRequest._retried ||
      isAuthWhitelistedURL(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    // Mark retried — never retry twice
    originalRequest._retried = true;

    // If refresh in progress → enqueue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    // Start refresh
    isRefreshing = true;

    try {
      const newToken = await refreshSessionAccessToken();

      syncAuthStoreFromAccessToken(newToken);

      // Drain the queue
      processQueue(null, newToken);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed → reject queue + force logout
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;