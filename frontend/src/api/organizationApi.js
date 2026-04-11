import apiClient from '../utils/axios';

/**
 * API helper for organization-scoped requests
 * Automatically injects organization ID into request params or body
 */

// Get organization ID from localStorage or context
export const getOrganizationIdFromStorage = (slug) => {
  if (!slug) return null;
  const storageKey = `org_${slug}`;
  const cached = localStorage.getItem(storageKey);
  if (!cached) return null;
  try {
    return JSON.parse(cached)?.id;
  } catch {
    return null;
  }
};

/**
 * Create organization-scoped request with org ID in params
 */
export const createOrgRequest = (slug) => {
  const orgId = getOrganizationIdFromStorage(slug);
  return {
    orgId,
    getParams: (additionalParams = {}) => ({
      organizationId: orgId,
      ...additionalParams,
    }),
  };
};

/**
 * Example API calls using orgId
 * These can be customized based on your backend needs
 */

export const getForumCategories = (slug, params = {}) => {
  const { orgId } = createOrgRequest(slug);
  return apiClient.get('/forum/categories', {
    params: { organizationId: orgId, ...params },
  });
};

export const getForumTopics = (slug, params = {}) => {
  const { orgId } = createOrgRequest(slug);
  return apiClient.get('/forum/topics', {
    params: { organizationId: orgId, ...params },
  });
};

export const getEvents = (slug, params = {}) => {
  const { orgId } = createOrgRequest(slug);
  return apiClient.get('/events', {
    params: { organizationId: orgId, ...params },
  });
};

export const getNews = (slug, params = {}) => {
  const { orgId } = createOrgRequest(slug);
  return apiClient.get('/news', {
    params: { organizationId: orgId, ...params },
  });
};

export const getJobs = (slug, params = {}) => {
  const { orgId } = createOrgRequest(slug);
  return apiClient.get('/jobs', {
    params: { organizationId: orgId, ...params },
  });
};

export const getLearningResources = (slug, params = {}) => {
  const { orgId } = createOrgRequest(slug);
  return apiClient.get('/learning-resources', {
    params: { organizationId: orgId, ...params },
  });
};

export const getFunds = (slug, params = {}) => {
  const { orgId } = createOrgRequest(slug);
  return apiClient.get('/funds', {
    params: { organizationId: orgId, ...params },
  });
};

// POST requests - include orgId in body
export const createForumTopic = (slug, data) => {
  const { orgId } = createOrgRequest(slug);
  return apiClient.post('/forum/topics', {
    ...data,
    organizationId: orgId,
  });
};

export const createEvent = (slug, data) => {
  const { orgId } = createOrgRequest(slug);
  return apiClient.post('/events', {
    ...data,
    organizationId: orgId,
  });
};

export const createNews = (slug, data) => {
  const { orgId } = createOrgRequest(slug);
  return apiClient.post('/news', {
    ...data,
    organizationId: orgId,
  });
};

export const createJob = (slug, data) => {
  const { orgId } = createOrgRequest(slug);
  return apiClient.post('/jobs', {
    ...data,
    organizationId: orgId,
  });
};

export const postForumTopic = (slug, data) => {
  const { orgId } = createOrgRequest(slug);
  return apiClient.post('/forum/topics', {
    ...data,
    organizationId: orgId,
  });
};
