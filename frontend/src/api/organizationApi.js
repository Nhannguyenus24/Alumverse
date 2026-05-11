import apiClient from '../utils/axios';

const unwrap = (response) => response?.data?.data;

export const organizationApi = {
  async getOrganizationBySlug(slug) {
    const response = await apiClient.get(`/organizations/${slug}`);
    return unwrap(response);
  },

  async getAllOrganizations() {
    const response = await apiClient.get('/organizations');
    return unwrap(response) ?? [];
  },

  async createSchoolFeedback(organizationId, payload) {
    const response = await apiClient.post(`/organizations/${organizationId}/feedbacks`, payload);
    return unwrap(response);
  },
};
