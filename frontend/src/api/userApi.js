import apiClient from '../utils/axios';
import useAuthStore from '../stores/authStore';

export const joinOrganization = (payload) => {
  const userId = useAuthStore.getState().user?.id;
  const body = {
    organizationId: Number(payload.organizationId),
    userId: Number(userId),
    graduatedYear: payload.graduatedYear ? Number(payload.graduatedYear) : null,
    graduationStatus: payload.graduationStatus ?? null,
    program: payload.program ?? null,
    major: payload.major ?? null,
    verificationLevel: 0,
    status: 'active',
  };
  return apiClient.post('/admin/users/organization-member', body);
};

export const getTrustedVerifiers = (organizationId) => {
  return apiClient.get(`/organizations/${Number(organizationId)}/trusted-verifiers`);
};

export const requestPeerVerification = ({ organizationId, verifierUserId }) => {
  return apiClient.post('/users/me/peer-verifications/request', {
    organizationId: Number(organizationId),
    verifierUserId: Number(verifierUserId),
  });
};

export const createVerificationRequest = (payload) => {
  return apiClient.post('/users/me/verification-requests', payload);
};
