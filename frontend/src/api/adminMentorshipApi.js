import apiClient from '../utils/axios';

const unwrap = (response) => response?.data?.data;

export const adminMentorshipApi = {
  async getAllSessions(params = {}) {
    const response = await apiClient.get('/admin/mentorship/sessions', { params });
    return unwrap(response);
  },
};
const BASE = '/admin/mentorship';

export const getAllSessions = (page = 0, size = 10) =>
  apiClient.get(`${BASE}/sessions`, { params: { page, size } });

export const getSessionsByStatus = (status, page = 0, size = 10) =>
  apiClient.get(`${BASE}/sessions/by-status`, { params: { status, page, size } });

export const getSessionById = (sessionId) =>
  apiClient.get(`${BASE}/sessions/${sessionId}`);

export const updateSessionStatus = (sessionId, status) =>
  apiClient.put(`${BASE}/sessions/${sessionId}/status`, null, { params: { status } });

export const deleteSession = (sessionId) =>
  apiClient.delete(`${BASE}/sessions/${sessionId}`);

export const getAllMentorProfiles = (page = 0, size = 10) =>
  apiClient.get(`${BASE}/mentors`, { params: { page, size } });

export const getMentorProfilesByApproval = (isApproved, page = 0, size = 10) =>
  apiClient.get(`${BASE}/mentors/by-approval`, { params: { isApproved, page, size } });

export const approveMentor = (memberId) =>
  apiClient.post(`${BASE}/mentors/${memberId}/approve`);

export const getMentorshipStatistics = () =>
  apiClient.get(`${BASE}/statistics`);
