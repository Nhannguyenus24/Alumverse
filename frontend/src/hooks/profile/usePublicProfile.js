import { useQuery } from '@tanstack/react-query';
import apiClient from '../../utils/axios';
import useOrganizationStore from '../../stores/organizationStore';

const getPublicProfile = async (userId, organizationId) => {
  const url = organizationId 
    ? `/users/${userId}/public-profile?organizationId=${organizationId}` 
    : `/users/${userId}/public-profile`;
  const res = await apiClient.get(url);
  return res?.data?.data ?? null;
};

export const usePublicProfile = (userId, { enabled = true } = {}) => {
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);

  return useQuery({
    queryKey: ['publicProfile', userId, organizationId],
    queryFn: () => getPublicProfile(userId, organizationId),
    enabled: Boolean(userId) && enabled,
  });
};
