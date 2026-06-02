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
   * @returns {Promise<{
   *   status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
   *   cooldownUntil: string | null;
   *   latestMessage: object | null;
   * } | null>}
   */
  async getConversationRequestStatus(targetMemberId) {
    const response = await apiClient.get('/chat/conversation-requests/connection-status', {
      params: { targetMemberId },
    });
    return unwrap(response) ?? null;
  },

  /**
   * @param {number} targetMemberId
   * @param {string} message
   * @returns {Promise<number>} id of the created conversation request
   */
  async createConversationRequest(targetMemberId, message) {
    const response = await apiClient.post('/chat/conversation-requests', {
      targetMemberId,
      message,
    });
    return unwrap(response);
  },

  /**
   * @param {{ fullName?: string; status?: string; page?: number; size?: number }} params
   * @returns {Promise<import('../shared/types').PaginatedResponse>}
   */
  async searchIncomingRequests({ fullName, status, page = 0, size = 10 } = {}) {
    const response = await apiClient.get('/chat/conversation-requests/search', {
      params: { fullName, status, page, size },
    });
    return unwrap(response);
  },

  /**
   * @param {number} requestId
   * @param {'ACCEPTED' | 'REJECTED'} status
   * @returns {Promise<{ status: string; message: string | null }>}
   */
  async respondToConversationRequest(requestId, status) {
    const response = await apiClient.put('/chat/conversation-requests/respond', {
      id: requestId,
      status,
    });
    return unwrap(response);
  },
};
