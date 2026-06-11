import { useQuery } from '@tanstack/react-query';
import { getMyMentorProfile } from '../../utils/api';
import useAuthStore from '../../stores/authStore';

const fetchMyProfile = async () => {
  try {
    const res = await getMyMentorProfile();
    return res?.data?.data ?? null;
  } catch (err) {
    // 404 = user has no mentor profile — treat as null, not an error
    if (err?.response?.status === 404) return null;
    throw err;
  }
};

export const useMyMentorProfile = () => {
  const isLoggedIn = useAuthStore((state) => Boolean(state.user?.id));
  return useQuery({
    queryKey: ['mentorship', 'mentor', 'me', 'profile'],
    queryFn: fetchMyProfile,
    retry: false,
    staleTime: 5 * 60_000,
    enabled: isLoggedIn,
  });
};
