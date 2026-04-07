import apiClient from '../utils/axios';

const BASE = '/admin/forum/admin';

// ========== STATISTICS ==========

export const getForumStatistics = () =>
  apiClient.get(`${BASE}/statistics`);

export const getTopContributors = (month, year) =>
  apiClient.get(`${BASE}/statistics/top-contributors`, { params: { month, year } });

export const getOrganizationEngagement = () =>
  apiClient.get(`${BASE}/statistics/engagement`);

export const getMonthlyTimeline = (year) =>
  apiClient.get(`${BASE}/statistics/timeline`, { params: { year } });

// ========== POSTS ==========

export const getNewPostsYesterdayPaginated = (page = 0, size = 10) =>
  apiClient.get(`${BASE}/posts/yesterday/paginated`, { params: { page, size } });

export const getBannedPosts = (page = 0, size = 10) =>
  apiClient.get(`${BASE}/posts/banned/list`, { params: { page, size } });

export const banPost = (postId) =>
  apiClient.post(`${BASE}/posts/${postId}/ban`);

export const unbanPost = (postId) =>
  apiClient.post(`${BASE}/posts/${postId}/unban`);

export const deletePost = (postId) =>
  apiClient.delete(`${BASE}/posts/${postId}`);

// ========== CATEGORIES ==========

export const getAllCategories = (organizationId) =>
  apiClient.get(`${BASE}/categories`, { params: { organizationId } });

export const getCategoryById = (categoryId) =>
  apiClient.get(`${BASE}/categories/${categoryId}`);

export const createCategory = (organizationId, name, description) =>
  apiClient.post(`${BASE}/categories`, null, { params: { organizationId, name, description } });

export const updateCategory = (categoryId, name, description) =>
  apiClient.put(`${BASE}/categories/${categoryId}`, null, { params: { name, description } });

export const deleteCategory = (categoryId) =>
  apiClient.delete(`${BASE}/categories/${categoryId}`);

// ========== TOPICS ==========

export const getAllTopics = (organizationId, page = 0, size = 10) =>
  apiClient.get(`${BASE}/topics`, { params: { organizationId, page, size } });

export const getTopicById = (topicId) =>
  apiClient.get(`${BASE}/topics/${topicId}`);

export const createTopic = (organizationId, categoryId, title, createdByMemberId) =>
  apiClient.post(`${BASE}/topics`, null, { params: { organizationId, categoryId, title, createdByMemberId } });

export const updateTopic = (topicId, title, categoryId) =>
  apiClient.put(`${BASE}/topics/${topicId}`, null, { params: { title, categoryId } });

export const deleteTopic = (topicId) =>
  apiClient.delete(`${BASE}/topics/${topicId}`);
