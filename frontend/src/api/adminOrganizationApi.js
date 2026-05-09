import apiClient from '../utils/axios';

const unwrap = (response) => response?.data?.data;

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.items) return payload.items;
  if (payload?.content) return payload.content;
  return [];
};

export const adminOrganizationApi = {
  async getOrganizations({ page = 0, size = 50 } = {}) {
    const response = await apiClient.get('/admin/organizations', { params: { page, size } });
    return normalizeList(unwrap(response));
  },

  async updateOrganization(id, payload) {
    const response = await apiClient.put(`/admin/organizations/${id}`, payload);
    return unwrap(response);
  },

  async upsertIntroduction(id, payload) {
    const response = await apiClient.put(`/admin/organizations/${id}/introduction`, payload);
    return unwrap(response);
  },

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
};
