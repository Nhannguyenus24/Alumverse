import apiClient from '../utils/axios';

/**
 * User API endpoints for profile and organization membership
 */

/**
 * Get current user profile
 * @returns {Promise} User profile data
 */
export const getUserProfile = () => {
  return apiClient.get('/user/profile');
};

/**
 * Get all organizations user is member of
 * @returns {Promise} List of organizations
 */
export const getUserOrganizations = () => {
  return apiClient.get('/user/organizations');
};

/**
 * Check if user is member of specific organization
 * @param {number} organizationId - Organization ID to check
 * @returns {Promise} Membership status
 */
export const checkOrganizationMembership = (organizationId) => {
  return apiClient.get(`/user/organizations/${organizationId}/membership`);
};

/**
 * Get organization membership details
 * @param {number} organizationId - Organization ID
 * @returns {Promise} Membership details
 */
export const getOrganizationMembershipDetails = (organizationId) => {
  return apiClient.get(`/user/organizations/${organizationId}/details`);
};

/**
 * Join/register user to an organization
 * @param {object} data - Join request data
 * @param {number} data.organizationId - Organization ID to join
 * @param {string} [data.studentCode] - Optional student code
 * @param {string} [data.className] - Optional class name
 * @param {number} [data.startYear] - Optional start year
 * @param {number} [data.graduatedYear] - Optional graduated year
 * @param {string} [data.degreeType] - Optional degree type
 * @returns {Promise} Newly created membership details
 */
export const joinOrganization = (data) => {
  return apiClient.post('/user/organizations/join', data);
};
