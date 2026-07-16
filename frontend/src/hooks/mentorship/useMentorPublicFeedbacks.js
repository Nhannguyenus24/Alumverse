import { useQuery } from '@tanstack/react-query';
import { getMentorFeedbacks } from '../../utils/api';
import useOrganizationStore from '../../stores/organizationStore';

const fetchFeedbacks = async ({ mentorMemberId, page, limit, organizationId }) => {
  const res = await getMentorFeedbacks(mentorMemberId, page, limit, organizationId);
  return res?.data?.data ?? null;
};

export const useMentorPublicFeedbacks = (mentorMemberId, page = 0, limit = 10, { enabled = true } = {}) => {
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);

  return useQuery({
    queryKey: ['mentorship', 'mentor', mentorMemberId, 'feedbacks', page, limit, organizationId],
    queryFn: () => fetchFeedbacks({ mentorMemberId, page, limit, organizationId }),
    enabled: Boolean(mentorMemberId) && enabled,
    keepPreviousData: true,
  });
};
