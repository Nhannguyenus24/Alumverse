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
