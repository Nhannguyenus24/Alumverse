import apiClient from '../utils/axios';

const unwrap = (response) => response?.data?.data;

/**
 * @param {{
 *   fullName?: string;
 *   program?: string;
 *   major?: string;
 *   startYear?: number;
 *   page?: number;
 *   size?: number;
 * }} params
 */
export const networkApi = {
  async searchMembers(params = {}) {
    const response = await apiClient.get('/chat/network/members', { params });
    return unwrap(response);
  },
};
