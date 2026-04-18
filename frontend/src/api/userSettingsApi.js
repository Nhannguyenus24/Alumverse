import apiClient from '../utils/axios';

const unwrap = (response) => response?.data?.data;

export const userSettingsApi = {
  async getProfile() {
    const response = await apiClient.get('/users/me/profile');
    return unwrap(response);
  },

  async getOrganizationMember(organizationId) {
    const response = await apiClient.get('/users/me/organization-member', {
      params: { organizationId },
    });
    return unwrap(response);
  },

  async getNotificationSettings() {
    const response = await apiClient.get('/users/me/notification-settings');
    return unwrap(response);
  },

  async updateProfile(payload) {
    const response = await apiClient.put('/users/me/profile', payload);
    return unwrap(response);
  },

  async updateNotificationSettings(payload) {
    const response = await apiClient.put('/users/me/notification-settings', payload);
    return unwrap(response);
  },

  async changePassword(payload) {
    const response = await apiClient.put('/users/me/password', payload);
    return unwrap(response);
  },

  async getLoginHistory(params = { page: 0, limit: 10 }) {
    const response = await apiClient.get('/users/me/login-history', { params });
    return unwrap(response) ?? [];
  },
};
