import apiClient from '../utils/axios';
import { adminOrganizationApi } from './adminOrganizationApi';

const unwrap = (response) => response?.data?.data;

export const eventApi = {
  async createEvent(payload) {
    const response = await apiClient.post('/events', payload);
    return unwrap(response);
  },

  async getAdminEvents(params = {}) {
    const response = await apiClient.get('/admin/events', { params });
    return unwrap(response);
  },

  async getAdminEventsByOrganization(organizationId, params = {}) {
    const response = await apiClient.get(`/admin/events/organization/${organizationId}`, { params });
    return unwrap(response);
  },

  async searchAdminEvents(keyword, params = {}) {
    const response = await apiClient.get('/admin/events/search', { params: { keyword, ...params } });
    return unwrap(response);
  },

  async getAdminEventStatistics() {
    const response = await apiClient.get('/admin/events/statistics');
    return unwrap(response);
  },

  async getAdminOrganizations(params = {}) {
    return adminOrganizationApi.getOrganizations(params);
  },

  async updateAdminEvent(eventId, payload) {
    const response = await apiClient.put(`/admin/events/${eventId}`, payload);
    return unwrap(response);
  },

  async publishAdminEvent(eventId) {
    const response = await apiClient.post(`/admin/events/${eventId}/publish`);
    return unwrap(response);
  },

  async unpublishAdminEvent(eventId) {
    const response = await apiClient.post(`/admin/events/${eventId}/unpublish`);
    return unwrap(response);
  },

  async deleteAdminEvent(eventId) {
    const response = await apiClient.delete(`/admin/events/${eventId}`);
    return unwrap(response);
  },

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
