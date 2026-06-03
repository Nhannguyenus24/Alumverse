import { useQuery } from '@tanstack/react-query';
import { getMentorProfile } from '../../utils/api';

const fetchMentorProfile = async (mentorMemberId) => {
  const res = await getMentorProfile(mentorMemberId);
  return res?.data?.data ?? null;
};

export const useMentorPublicProfile = (mentorMemberId, { enabled = true } = {}) =>
  useQuery({
    queryKey: ['mentorship', 'mentor', mentorMemberId],
    queryFn: () => fetchMentorProfile(mentorMemberId),
    enabled: Boolean(mentorMemberId) && enabled,
  });
