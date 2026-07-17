import { useQuery } from '@tanstack/react-query';
import { getMentorProfile } from '../../utils/api';
import useOrganizationStore from '../../stores/organizationStore';

const fetchMentorProfile = async (mentorMemberId, organizationId) => {
  const res = await getMentorProfile(mentorMemberId, organizationId);
  return res?.data?.data ?? null;
};

export const useMentorPublicProfile = (mentorMemberId, { enabled = true } = {}) => {
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);

  return useQuery({
    queryKey: ['mentorship', 'mentor', mentorMemberId, organizationId],
    queryFn: () => fetchMentorProfile(mentorMemberId, organizationId),
    enabled: Boolean(mentorMemberId) && enabled,
  });
};
