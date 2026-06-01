import { useQuery } from '@tanstack/react-query';
import { getMyMentorSessions } from '../../utils/api';

const fetchMentorSessions = async (params) => {
  const res = await getMyMentorSessions(params);
  return res?.data?.data ?? null;
};

export const useMyMentorSessions = (params = {}) =>
  useQuery({
    queryKey: ['mentorship', 'mentor', 'sessions', params],
    queryFn: () => fetchMentorSessions(params),
    keepPreviousData: true,
  });
