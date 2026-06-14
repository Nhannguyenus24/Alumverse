import { useQuery } from '@tanstack/react-query';
import { getMentorExpertise } from '../../utils/api';

export const useMentorExpertise = (mentorMemberId, { enabled = true } = {}) =>
  useQuery({
    queryKey: ['mentorship', 'mentor', mentorMemberId, 'expertise'],
    queryFn: async () => {
      const res = await getMentorExpertise(mentorMemberId);
      return res?.data?.data ?? [];
    },
    enabled: Boolean(mentorMemberId) && enabled,
  });
