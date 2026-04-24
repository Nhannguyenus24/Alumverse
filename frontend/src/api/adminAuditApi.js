import apiClient from '../utils/axios';

const BASE = '/admin/audit';

// LoginHistoryResponse: id, userId, email, userName, loginAt, loginMethod, loginIp, userAgent

export const getLoginHistory = (page = 0, size = 50) =>
  apiClient.get(`${BASE}/login-history`, { params: { page, size } });

export const getLoginHistoryByUser = (userId, page = 0, size = 50) =>
  apiClient.get(`${BASE}/login-history/user/${userId}`, { params: { page, size } });

export const getLoginStats = () =>
  apiClient.get(`${BASE}/login-history/stats`);

export const getSuspiciousLogins = () =>
  apiClient.get(`${BASE}/login-history/suspicious`);
