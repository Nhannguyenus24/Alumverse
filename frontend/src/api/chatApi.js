import apiClient from '../utils/axios';

const unwrap = (response) => response?.data?.data;

const BACKEND_PAGE_SIZE = 5;

export const chatApi = {
  /**
   * @param {{ text?: string; page?: number; size?: number }} params
   */
  async listGroupChats({ text = '', page = 0, size = BACKEND_PAGE_SIZE } = {}) {
    const response = await apiClient.get('/chat/groups', { params: { text, page, size } });
    return unwrap(response);
  },

  /**
   * @param {{ text?: string; page?: number; size?: number }} params
   */
  async listPrivateChats({ text = '', page = 0, size = BACKEND_PAGE_SIZE } = {}) {
    const response = await apiClient.get('/chat/private/list', { params: { text, page, size } });
    return unwrap(response);
  },
};
