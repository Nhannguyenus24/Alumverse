import { useQuery } from '@tanstack/react-query';
import apiClient from '../../utils/axios';

export const getPublicProfile = async (userId) => {
  const res = await apiClient.get(`/users/${userId}/public-profile`);
  return res?.data?.data ?? null;
};

export const usePublicProfile = (userId, { enabled = true } = {}) =>
  useQuery({
    queryKey: ['publicProfile', userId],
    queryFn: () => getPublicProfile(userId),
    enabled: Boolean(userId) && enabled,
  });
