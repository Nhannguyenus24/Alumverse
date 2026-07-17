import { useQuery } from '@tanstack/react-query';
import { getMentorExpertise } from '../../utils/api';
import useOrganizationStore from '../../stores/organizationStore';

export const useMentorExpertise = (mentorMemberId, { enabled = true } = {}) => {
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);

  return useQuery({
    queryKey: ['mentorship', 'mentor', mentorMemberId, 'expertise', organizationId],
    queryFn: async () => {
      const res = await getMentorExpertise(mentorMemberId, organizationId);
      return res?.data?.data ?? [];
    },
    enabled: Boolean(mentorMemberId) && enabled,
  });
};
