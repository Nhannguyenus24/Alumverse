import apiClient from '../utils/axios';

const BASE = '/admin/users';

// ========== USERS ==========

export const getUsers = (page = 0, size = 20) =>
  apiClient.get(BASE, { params: { page, size } });

export const getUserById = (userId) =>
  apiClient.get(`${BASE}/${userId}`);

export const getUsersByOrganization = (organizationId, page = 0, size = 20) =>
  apiClient.get(`${BASE}/organization/${organizationId}`, { params: { page, size } });

// ========== MUTATIONS ==========

// BanUserRequest only accepts userId — reason/duration are local UI state only
export const banUser = (userId) =>
  apiClient.post(`${BASE}/ban`, { userId });

export const unbanUser = (userId) =>
  apiClient.post(`${BASE}/unban`, { userId });

// hardDelete defaults to false (soft delete)
export const deleteUser = (userId, hardDelete = false) =>
  apiClient.delete(BASE, { data: { userId, hardDelete } });

// UpdateUserRequest: email, userName, role, status — no fullName or organizationId
export const updateUser = (userId, payload) =>
  apiClient.put(`${BASE}/${userId}`, payload);

// ========== VERIFICATION ==========

export const getVerificationRequests = (pendingOnly = false, page = 0, size = 20) =>
  apiClient.get(`${BASE}/verification-requests`, { params: { pendingOnly, page, size } });

export const getUserVerificationRequests = (userId) =>
  apiClient.get(`${BASE}/${userId}/verification-requests`);

export const reviewVerificationRequest = (requestId, status, adminNote) =>
  apiClient.put(`${BASE}/verification-requests/${requestId}`, { status, adminNote });

// ========== MEMBERSHIP ==========

export const addOrganizationMember = (payload) =>
  apiClient.post(`${BASE}/organization-member`, payload);

export const getUserActivity = (userId) =>
  apiClient.get(`${BASE}/${userId}/activity`);

export const resetPasswordByAdmin = (userId, payload) =>
  apiClient.post(`${BASE}/${userId}/reset-password`, payload);
