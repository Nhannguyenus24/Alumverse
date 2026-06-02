import { useQuery } from '@tanstack/react-query';
import { getMyMentorFeedbacks } from '../../utils/api';

const fetchMyFeedbacks = async ({ page, limit }) => {
  const res = await getMyMentorFeedbacks(page, limit);
  return res?.data?.data ?? null;
};

export const useMyMentorFeedbacks = (page = 0, limit = 10) =>
  useQuery({
    queryKey: ['mentorship', 'mentor', 'me', 'feedbacks', page, limit],
    queryFn: () => fetchMyFeedbacks({ page, limit }),
    keepPreviousData: true,
  });
