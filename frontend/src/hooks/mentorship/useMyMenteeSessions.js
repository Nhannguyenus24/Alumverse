import { useQuery } from '@tanstack/react-query';
import { getMyMenteeSessions } from '../../utils/api';

const fetchMySessions = async (params) => {
  const res = await getMyMenteeSessions(params);
  return res?.data?.data ?? null;
};

/**
 * params: { date?, mentorName?, page?, limit? }
 * Returns React Query result; data is PaginatedResponse<MentorshipSessionResponse>.
 */
export const useMyMenteeSessions = (params = {}) =>
  useQuery({
    queryKey: ['mentorship', 'mentee', 'sessions', params],
    queryFn: () => fetchMySessions(params),
    keepPreviousData: true,
  });
