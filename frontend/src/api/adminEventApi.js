import apiClient from '../utils/axios';

const BASE = '/admin/events';

export const getAllEvents = (page = 0, size = 10) =>
  apiClient.get(BASE, { params: { page, size } });

export const getEventsByOrganization = (organizationId, page = 0, size = 10) =>
  apiClient.get(`${BASE}/organization/${organizationId}`, { params: { page, size } });

export const searchAllEvents = (keyword, page = 0, size = 10) =>
  apiClient.get(`${BASE}/search`, { params: { keyword, page, size } });

export const getEventsByPublishStatus = (isPublished, page = 0, size = 10) =>
  apiClient.get(`${BASE}/by-status`, { params: { isPublished, page, size } });

export const getEventById = (eventId) =>
  apiClient.get(`${BASE}/${eventId}`);

export const updateEvent = (eventId, payload) =>
  apiClient.put(`${BASE}/${eventId}`, payload);

export const deleteEvent = (eventId) =>
  apiClient.delete(`${BASE}/${eventId}`);

export const publishEvent = (eventId) =>
  apiClient.post(`${BASE}/${eventId}/publish`);

export const unpublishEvent = (eventId) =>
  apiClient.post(`${BASE}/${eventId}/unpublish`);

export const getTicketsByEvent = (eventId, page = 0, size = 10) =>
  apiClient.get(`${BASE}/${eventId}/tickets`, { params: { page, size } });

export const cancelTicket = (ticketCode) =>
  apiClient.post(`${BASE}/tickets/${ticketCode}/cancel`);

export const getInterestsByEvent = (eventId, page = 0, size = 10) =>
  apiClient.get(`${BASE}/${eventId}/interests`, { params: { page, size } });

export const getEventStatistics = () =>
  apiClient.get(`${BASE}/statistics`);
