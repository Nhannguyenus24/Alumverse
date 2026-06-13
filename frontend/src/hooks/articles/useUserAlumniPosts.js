import { useQuery } from '@tanstack/react-query';
import apiClient from '../../utils/axios';

export const getUserAlumniPosts = async (userId, page = 0, limit = 10) => {
  const res = await apiClient.get(`/articles/alumni-posts/user/${userId}`, {
    params: { page, limit }
  });
  console.log('getUserAlumniPosts result:', res?.data?.data);
  return res?.data?.data ?? null;
};

export const useUserAlumniPosts = (userId, page = 0, limit = 10, { enabled = true } = {}) =>
  useQuery({
    queryKey: ['userAlumniPosts', userId, page, limit],
    queryFn: () => getUserAlumniPosts(userId, page, limit),
    enabled: Boolean(userId) && enabled,
  });
