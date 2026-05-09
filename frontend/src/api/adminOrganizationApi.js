import apiClient from '../utils/axios';

const unwrap = (response) => response?.data?.data;

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.items) return payload.items;
  if (payload?.content) return payload.content;
  return [];
};

export const adminOrganizationApi = {
  // --- Basic CRUD ---
  async getOrganizations({ page = 0, size = 50 } = {}) {
    const response = await apiClient.get('/admin/organizations', { params: { page, size } });
    return normalizeList(unwrap(response));
  },

  async getOrganizationById(id) {
    const response = await apiClient.get(`/admin/organizations/${id}`);
    return unwrap(response);
  },

  async createOrganization(payload) {
    const response = await apiClient.post('/admin/organizations', payload);
    return unwrap(response);
  },

  async updateOrganization(id, payload) {
    const response = await apiClient.put(`/admin/organizations/${id}`, payload);
    return unwrap(response);
  },

  async deleteOrganization(id) {
    const response = await apiClient.delete(`/admin/organizations/${id}`);
    return unwrap(response);
  },

  // --- Introduction ---
  async upsertIntroduction(id, payload) {
    const response = await apiClient.put(`/admin/organizations/${id}/introduction`, payload);
    return unwrap(response);
  },

  // --- Feedback ---
  async getSchoolFeedbacks({ organizationId, page = 0, size = 10 } = {}) {
    const params = { page, size };
    if (organizationId) params.organizationId = organizationId;
    const response = await apiClient.get('/admin/organizations/feedbacks', { params });
    return unwrap(response);
  },

  async markSchoolFeedbackAsRead(feedbackId) {
    const response = await apiClient.patch(`/admin/organizations/feedbacks/${feedbackId}/read`);
    return unwrap(response);
  },

  // --- Features Config ---
  async getFeaturesConfig(id) {
    const response = await apiClient.get(`/admin/organizations/${id}/features-config`);
    return unwrap(response);
  },

  async updateFeaturesConfig(id, payload) {
    const response = await apiClient.put(`/admin/organizations/${id}/features-config`, payload);
    return unwrap(response);
  },

  async toggleFeature(id, featureName) {
    const response = await apiClient.patch(`/admin/organizations/${id}/features-config/features/${featureName}/toggle`);
    return unwrap(response);
  },

  // --- Programs & Majors ---
  async getPrograms(id) {
    const response = await apiClient.get(`/admin/organizations/${id}/programs`);
    return unwrap(response);
  },

  async addProgram(id, value) {
    const response = await apiClient.post(`/admin/organizations/${id}/programs`, { value });
    return unwrap(response);
  },

  async getMajors(id) {
    const response = await apiClient.get(`/admin/organizations/${id}/majors`);
    return unwrap(response);
  },

  async addMajor(id, value) {
    const response = await apiClient.post(`/admin/organizations/${id}/majors`, { value });
    return unwrap(response);
  },
};
