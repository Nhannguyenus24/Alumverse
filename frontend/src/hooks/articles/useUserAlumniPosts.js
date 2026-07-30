import { useQuery } from '@tanstack/react-query';
import apiClient from '../../utils/axios';
import useOrganizationStore from '../../stores/organizationStore';

const getUserAlumniPosts = async (userId, organizationId, page = 0, limit = 10) => {
  const res = await apiClient.get(`/articles/alumni-posts/user/${userId}`, {
    params: { page, limit, organizationId }
  });
  return res?.data?.data ?? null;
};

export const useUserAlumniPosts = (userId, page = 0, limit = 10, { enabled = true } = {}) => {
  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);
  return useQuery({
    queryKey: ['userAlumniPosts', userId, organizationId, page, limit],
    queryFn: () => getUserAlumniPosts(userId, organizationId, page, limit),
    enabled: Boolean(userId) && Boolean(organizationId) && enabled,
  });
};
