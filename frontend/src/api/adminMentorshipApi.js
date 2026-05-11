import apiClient from '../utils/axios';

const unwrap = (response) => response?.data?.data;

export const adminMentorshipApi = {
  async getAllSessions(params = {}) {
    const response = await apiClient.get('/admin/mentorship/sessions', { params });
    return unwrap(response);
  },
};
