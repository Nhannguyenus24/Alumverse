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

  /**
   * @param {number} groupId
   * @param {number} page  0-based, page 0 = newest messages (DESC)
   * @param {number} size
   * @returns {Promise<Array>}
   */
  async getMessages(groupId, page = 0, size = 10) {
    const response = await apiClient.get(`/chat/groups/${groupId}/messages`, {
      params: { page, size },
    });
    return unwrap(response);
  },

  /**
   * @param {number} targetMemberId
   * @returns {Promise<'PENDING' | 'ACCEPTED' | 'REJECTED' | null>}
   */
  async getConversationRequestStatus(targetMemberId) {
    const response = await apiClient.get('/chat/conversation-requests/connection-status', {
      params: { targetMemberId },
    });
    return unwrap(response) ?? null;
  },
};
