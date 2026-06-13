import { useQuery } from '@tanstack/react-query';
import apiClient from '../../utils/axios';

export const getUserDonations = async (userId, page = 0, limit = 10) => {
  const res = await apiClient.get(`/fund-donations/user/${userId}`, {
    params: { page, limit }
  });
  console.log('getUserDonations result:', res?.data?.data);
  return res?.data?.data ?? null;
};

export const useUserDonations = (userId, page = 0, limit = 10, { enabled = true } = {}) =>
  useQuery({
    queryKey: ['userDonations', userId, page, limit],
    queryFn: () => getUserDonations(userId, page, limit),
    enabled: Boolean(userId) && enabled,
  });
