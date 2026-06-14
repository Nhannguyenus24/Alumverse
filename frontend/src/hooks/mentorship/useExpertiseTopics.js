import { useQuery } from '@tanstack/react-query';
import { getExpertiseTopics } from '../../utils/api';

const fetchTopics = async () => {
  const res = await getExpertiseTopics();
  return res?.data?.data ?? [];
};

export const useExpertiseTopics = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['mentorship', 'expertise-topics'],
    queryFn: fetchTopics,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
