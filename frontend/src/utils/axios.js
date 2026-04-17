import axios from 'axios';
import useAuthStore from '../stores/authStore';

const BASE_URL = '/api';

// Exact paths — không dùng includes() để tránh substring bypass
const AUTH_WHITELIST = ['/auth/login', '/auth/google-login', '/auth/refresh'];

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Instance riêng cho refresh — không có interceptor → tránh loop
const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// --- Refresh Token State ---
let isRefreshing = false;
let failedQueue = [];

/**
 * Resolve/reject tất cả request đang chờ trong queue
 */
const processQueue = (error, token = null) => {
  const queue = [...failedQueue];
  failedQueue = []; // Clear queue TRƯỚC khi process → tránh race condition
  queue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
};

/**
 * Kiểm tra URL có nằm trong whitelist hay không (exact match sau baseURL)
 */
const isAuthWhitelistedURL = (url = '') => {
  // Loại bỏ baseURL prefix nếu có, chỉ so sánh phần path
  const path = url.replace(BASE_URL, '');
  return AUTH_WHITELIST.some(
    (whitelisted) =>
      path === whitelisted || path.startsWith(whitelisted + '?')
  );
};

/**
 * Đăng xuất user và redirect về trang login
 */
const forceLogout = () => {
  useAuthStore.getState().reset();
  const currentPath = window.location.pathname;
  if (currentPath !== '/login') {
    window.location.href = '/login';
  }
};

/**
 * Gọi refresh token API, trả về access token mới
 * Throw error nếu thất bại
 */
const refreshAccessToken = async () => {
  const res = await refreshClient.post('/auth/refresh');
  const newToken = res?.data?.data?.accessToken;

  if (typeof newToken !== 'string' || newToken.length === 0) {
    throw new Error('Invalid access token received from refresh API');
  }

  return newToken;
};

// --- Request Interceptor: Đính kèm Token vào Header ---
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

// --- Response Interceptor: Xử lý lỗi 401 và Refresh Token ---
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Không xử lý nếu:
    // - Không phải 401
    // - Request đã retry rồi (chỉ retry 1 lần duy nhất)
    // - Request thuộc auth whitelist (login, refresh)
    if (
      error.response?.status !== 401 ||
      originalRequest._retried ||
      isAuthWhitelistedURL(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    // Đánh dấu đã retry — không bao giờ retry lần 2
    originalRequest._retried = true;

    // Nếu đang refresh → xếp vào hàng đợi
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    // Bắt đầu refresh
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();

      // Cập nhật token mới vào store
      useAuthStore.getState().setToken(newToken);

      // Giải phóng hàng đợi
      processQueue(null, newToken);

      // Retry request gốc với token mới
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh thất bại → reject toàn bộ queue + đăng xuất
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;