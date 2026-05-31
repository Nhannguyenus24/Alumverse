import apiClient from '../utils/axios';

const MENTOR = '/mentorship/mentor';
const MENTEE = '/mentorship/mentee';

// ========== MENTEE: PROFILE ==========

export const saveMenteeProfile = (payload) =>
  apiClient.post(`${MENTEE}/profile`, payload);

export const getMyMenteeProfile = () =>
  apiClient.get(`${MENTEE}/profile`);

// ========== MENTEE: BROWSE ==========

export const getApprovedMentors = (page = 0, limit = 12) =>
  apiClient.get(`${MENTEE}/mentors`, { params: { page, limit } });

export const getMentorProfile = (mentorMemberId) =>
  apiClient.get(`${MENTEE}/mentors/${mentorMemberId}`);

export const searchMentors = (keyword, page = 0, limit = 12) =>
  apiClient.get(`${MENTEE}/mentors/search`, { params: { keyword, page, limit } });

export const filterMentors = (params = {}) =>
  apiClient.get(`${MENTEE}/mentors/filter`, { params });

export const getExpertiseTopics = () =>
  apiClient.get(`${MENTEE}/expertise-topics`);

export const getExpertiseCategories = () =>
  apiClient.get(`${MENTEE}/expertise-categories`);

export const getMentorExpertise = (mentorMemberId) =>
  apiClient.get(`${MENTEE}/mentors/${mentorMemberId}/expertise`);

export const getMentorAvailableSlots = (mentorMemberId) =>
  apiClient.get(`${MENTEE}/mentors/${mentorMemberId}/availability`);

export const getMentorFeedbacks = (mentorMemberId, page = 0, limit = 10) =>
  apiClient.get(`${MENTEE}/mentors/${mentorMemberId}/feedbacks`, { params: { page, limit } });

// ========== MENTEE: BOOKING / SESSIONS ==========

export const bookSession = (payload) =>
  apiClient.post(`${MENTEE}/sessions/book`, payload);

export const getMyMenteeSessions = (params = {}) =>
  apiClient.get(`${MENTEE}/sessions`, { params });

export const getMenteeSessionById = (sessionId) =>
  apiClient.get(`${MENTEE}/sessions/${sessionId}`);

export const cancelSession = (sessionId) =>
  apiClient.post(`${MENTEE}/sessions/${sessionId}/cancel`);

export const createSessionFeedback = (sessionId, payload) =>
  apiClient.post(`${MENTEE}/sessions/${sessionId}/feedback`, payload);

// ========== MENTOR: PROFILE / EXPERTISE ==========

export const createMentorProfile = (payload) =>
  apiClient.post(`${MENTOR}/profile`, payload);

export const saveMentorProfileDraft = (payload) =>
  apiClient.post(`${MENTOR}/profile/draft`, payload);

export const updateMentorProfile = (payload) =>
  apiClient.put(`${MENTOR}/profile`, payload);

export const getMyMentorProfile = () => apiClient.get(`${MENTOR}/profile`);

export const addMyExpertise = (payload) =>
  apiClient.post(`${MENTOR}/expertise`, payload);

export const getMyExpertise = () => apiClient.get(`${MENTOR}/expertise`);

export const deleteMyExpertise = (expertiseId) =>
  apiClient.delete(`${MENTOR}/expertise/${expertiseId}`);

// ========== MENTOR: AVAILABILITY / SESSIONS ==========

export const addMyAvailability = (payload) =>
  apiClient.post(`${MENTOR}/availability`, payload);

export const getMyAvailabilities = () => apiClient.get(`${MENTOR}/availability`);

export const deleteMyAvailability = (availabilityId) =>
  apiClient.delete(`${MENTOR}/availability/${availabilityId}`);

export const getMyMentorSessions = (params = {}) =>
  apiClient.get(`${MENTOR}/sessions`, { params });

export const updateSessionStatus = (sessionId, payload) =>
  apiClient.put(`${MENTOR}/sessions/${sessionId}/status`, payload);

export const getMyMentorFeedbacks = (page = 0, limit = 10) =>
  apiClient.get(`${MENTOR}/feedbacks`, { params: { page, limit } });

// ========== FILES (CV upload) ==========

export const uploadCvFile = ({ base64String, fileName }) =>
  apiClient.post('/files/upload', { base64String, fileName });
