import axios from 'axios';
import useAuthStore from '../stores/authStore';
import { userFromAccessToken } from './jwt';

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

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
  let path = url.replace(BASE_URL, '');
  
  // Normalize path: ensure it starts with / and remove trailing ? if any
  if (path && !path.startsWith('/')) {
    path = '/' + path;
  }
  
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
  
  // Try to find a slug from the current URL to redirect back to the correct auth page
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const slug = pathParts.length > 0 ? pathParts[0] : 'alumni';
  
  const loginPath = `/${slug}/auth/login`;
  
  // Don't redirect if we are already on a login page to avoid loops
  if (window.location.pathname !== loginPath && !window.location.pathname.includes('/auth/login')) {
    console.warn('Session expired or invalid. Redirecting to login...');
    window.location.href = loginPath;
  }
};

/**
 * Calls refresh-token API and returns the new session data (throws if it fails)
 */
export async function refreshSessionAccessToken() {
  try {
    const res = await refreshClient.post('/auth/refresh');
    const data = res?.data?.data; // { accessToken, verificationLevel }

    if (!data?.accessToken || typeof data.accessToken !== 'string') {
      throw new Error('Invalid access token received from refresh API');
    }

    return data;
  } catch (error) {
    console.error('Failed to refresh session access token:', error.response?.data || error.message);
    throw error;
  }
}

/** Updates token, user and verification level in the store from response data. */
export function syncAuthStoreFromAccessToken(data) {
  // Support both object { accessToken, verificationLevel } and legacy string (just in case)
  const accessToken = typeof data === 'string' ? data : data?.accessToken;
  const verificationLevel = typeof data === 'string' ? undefined : data?.verificationLevel;

  if (!accessToken) return;

  const authUser = userFromAccessToken(accessToken);
  const authPayload = { token: accessToken };
  
  if (authUser) authPayload.user = authUser;
  if (verificationLevel !== undefined && verificationLevel !== null) {
    authPayload.verificationLevel = verificationLevel;
  }

  useAuthStore.getState().setAuth(authPayload);
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
      isAuthWhitelistedURL(originalRequest.url || '')
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
        // Apply new token to the retried request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }).catch((err) => {
        return Promise.reject(err);
      });
    }

    // Start refresh
    isRefreshing = true;

    try {
      console.log('Access token expired. Attempting silent refresh...');
      const refreshData = await refreshSessionAccessToken();
      const newToken = refreshData.accessToken;

      syncAuthStoreFromAccessToken(refreshData);

      // Drain the queue with the raw token string
      processQueue(null, newToken);

      // Retry original request with new token string
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
