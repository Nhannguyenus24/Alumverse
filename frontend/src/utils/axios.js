import axios from 'axios';
// The configured i18next singleton (initialized in ../i18n). Imported from
// 'i18next' directly to avoid a circular dependency with the i18n entry module.
import i18n from 'i18next';
import useAuthStore from '../stores/authStore';
import useOrganizationStore from '../stores/organizationStore';
import { userFromAccessToken } from './jwt';

// Always talk to the API on the SAME ORIGIN as the app (`/api`). This keeps the
// httpOnly refresh-token cookie first-party so it is actually stored and sent — a
// cross-site cookie (frontend on *.vercel.app, backend on *.duckdns.org) is treated
// as third-party and dropped by browsers, which breaks /auth/refresh and
// /auth/switch-organization ("refreshToken cookie present: false" → forced logout).
// The same origin is proxied to the real backend by the Vite dev server (see
// vite.config.js) in development and by Vercel rewrites (see vercel.json) in production.
const BASE_URL = '/api';

// Exact paths — avoid includes() to prevent substring bypass
const AUTH_WHITELIST = ['/auth/login', '/auth/google-login', '/auth/refresh', '/auth/logout'];

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
let refreshPromise = null;

const RATE_LIMIT_MAX_RETRIES = 2;
const SAFE_RETRY_METHODS = new Set(['get', 'head', 'options']);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Localize a failed response in-place using the backend's stable `errorCode`.
 *
 * The backend returns a machine-readable `errorCode` on every error (see the
 * Java GlobalExceptionHandler) plus a fallback `message`. We translate the code
 * via the `errors` i18n namespace and overwrite `data.message` so the ~200 call
 * sites that already render `error.response.data.message` show text in the
 * user's current language with zero per-site changes. When a code has no
 * translation key, `defaultValue` preserves the backend's original message.
 */
const localizeApiError = (error) => {
  const data = error?.response?.data;
  if (!data || typeof data !== 'object') return;

  const code = data.errorCode;
  if (!code) return;

  const fallback = typeof data.message === 'string' && data.message
    ? data.message
    : i18n.t('UNKNOWN', { ns: 'errors' });

  data.message = i18n.t(code, { ns: 'errors', defaultValue: fallback });
};

const getRetryAfterMs = (error, attempt) => {
  const retryAfter = error.response?.headers?.['retry-after'];
  const parsedSeconds = Number(retryAfter);

  if (Number.isFinite(parsedSeconds) && parsedSeconds > 0) {
    return Math.min(parsedSeconds * 1000, 15_000);
  }

  const parsedDate = retryAfter ? Date.parse(retryAfter) : Number.NaN;
  if (Number.isFinite(parsedDate)) {
    return Math.min(Math.max(parsedDate - Date.now(), 0), 15_000);
  }

  return Math.min(1200 * 2 ** attempt, 8000);
};

const shouldRetryRateLimitedRequest = (error, request) => {
  const method = (request?.method || 'get').toLowerCase();
  return (
    error.response?.status === 429 &&
    SAFE_RETRY_METHODS.has(method) &&
    (request._rateLimitRetries || 0) < RATE_LIMIT_MAX_RETRIES
  );
};

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
  console.warn('Session expired or invalid. Setting sessionExpired flag...');
  useAuthStore.getState().setSessionExpired(true);
};

/**
 * Calls refresh-token API and returns the new session data (throws if it fails).
 * Uses a promise lock to prevent multiple concurrent refresh requests.
 */
export async function refreshSessionAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      // The refresh token carries only the user identity — the organization is not stored
      // in it. Pass the org the client is currently on so the refreshed access token stays
      // scoped to it. ADMINs have no org (undefined) → refreshed as system admin.
      const viewedOrganizationId = useOrganizationStore.getState().organization?.id;
      const tokenOrganizationId = useAuthStore.getState().user?.organizationId;
      const organizationId = viewedOrganizationId ?? tokenOrganizationId;
      const config = organizationId != null ? { params: { organizationId } } : undefined;
      const res = await refreshClient.post('/auth/refresh', null, config);
      const data = res?.data?.data; // { accessToken, verificationLevel }

      if (!data?.accessToken || typeof data.accessToken !== 'string') {
        throw new Error('Invalid access token received from refresh API');
      }

      return data;
    } catch (error) {
      console.error('Failed to refresh session access token:', error.response?.data || error.message);
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response) {
      if (error.response.status > 500) {
        window.location.href = '/500';
        return Promise.reject(error);
      }
    } else {
      // No response implies network error, timeout, or server down
      window.location.href = '/maintenance';
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Translate the backend errorCode into the user's language before the error
    // propagates to any call site (which renders error.response.data.message).
    localizeApiError(error);

    if (shouldRetryRateLimitedRequest(error, originalRequest)) {
      const attempt = originalRequest._rateLimitRetries || 0;
      originalRequest._rateLimitRetries = attempt + 1;
      await wait(getRetryAfterMs(error, attempt));
      return apiClient(originalRequest);
    }

    // Skip handling when:
    // - Not 401
    // - Already retried (single retry only)
    // - URL is auth whitelist (login, refresh)
    // - There is no session token to refresh. Public/optional requests may
    //   receive 401, but they must not kick guests to the login page.
    const currentToken = useAuthStore.getState().token;
    if (
      error.response?.status !== 401 ||
      originalRequest._retried ||
      isAuthWhitelistedURL(originalRequest.url || '') ||
      !currentToken
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
