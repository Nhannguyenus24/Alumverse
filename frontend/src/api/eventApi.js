import apiClient from '../utils/axios';

const unwrap = (response) => response?.data?.data;

export const eventApi = {
  async getEvents(params = {}) {
    const response = await apiClient.get('/events', { params });
    return unwrap(response);
  },

  async updateEvent(eventId, payload) {
    const response = await apiClient.put(`/events/${eventId}`, payload);
    return unwrap(response);
  },

  async publishEvent(eventId) {
    const response = await apiClient.post(`/events/${eventId}/publish`);
    return unwrap(response);
  },

  async unpublishEvent(eventId) {
    const response = await apiClient.post(`/events/${eventId}/unpublish`);
    return unwrap(response);
  },

  async deleteEvent(eventId) {
    const response = await apiClient.delete(`/events/${eventId}`);
    return unwrap(response);
  },
};
