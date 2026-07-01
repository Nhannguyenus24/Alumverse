import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/axios';
import useOrganizationStore from '../stores/organizationStore';

const fetchMyOrgMember = async (organizationId) => {
  try {
    const res = await apiClient.get('/users/me/organization-member', {
      params: { organizationId },
    });
    return res?.data?.data ?? null;
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
};

/**
 * Returns the current user's OrganizationMember record (verificationLevel, graduationStatus, ...)
 * for the currently selected organization.
 */
export const useMyOrganizationMember = () => {
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);

  return useQuery({
    queryKey: ['user', 'me', 'organization-member', organizationId],
    queryFn: () => fetchMyOrgMember(organizationId),
    enabled: Boolean(organizationId),
    staleTime: 5 * 60 * 1000,
  });
};
