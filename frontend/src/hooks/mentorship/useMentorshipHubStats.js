import { useQuery } from '@tanstack/react-query';
import { getHubStats } from '../../utils/api';

export const useMentorshipHubStats = (enabled = true) => {
  return useQuery({
    queryKey: ['mentorship', 'hub', 'stats'],
    queryFn: async () => {
      const response = await getHubStats(5);
      return response?.data?.data;
    },
    retry: 1,
    enabled,
  });
};
