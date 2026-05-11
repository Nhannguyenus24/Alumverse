import { useQuery } from '@tanstack/react-query';
import { getMyMentorProfile } from '../../api/mentorshipApi';

const fetchMyProfile = async () => {
  const res = await getMyMentorProfile();
  return res?.data?.data ?? null;
};

/**
 * Loads the mentor profile of the currently authenticated user.
 * Returns null + isError when the user has no profile (BE returns 404).
 */
export const useMyMentorProfile = () =>
  useQuery({
    queryKey: ['mentorship', 'mentor', 'me', 'profile'],
    queryFn: fetchMyProfile,
    retry: false,
  });
