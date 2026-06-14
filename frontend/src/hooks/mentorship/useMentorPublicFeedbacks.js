import { useQuery } from '@tanstack/react-query';
import { getMentorFeedbacks } from '../../utils/api';

const fetchFeedbacks = async ({ mentorMemberId, page, limit }) => {
  const res = await getMentorFeedbacks(mentorMemberId, page, limit);
  return res?.data?.data ?? null;
};

export const useMentorPublicFeedbacks = (mentorMemberId, page = 0, limit = 10, { enabled = true } = {}) =>
  useQuery({
    queryKey: ['mentorship', 'mentor', mentorMemberId, 'feedbacks', page, limit],
    queryFn: () => fetchFeedbacks({ mentorMemberId, page, limit }),
    enabled: Boolean(mentorMemberId) && enabled,
    keepPreviousData: true,
  });
