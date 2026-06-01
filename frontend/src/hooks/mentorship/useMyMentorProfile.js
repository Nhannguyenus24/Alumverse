import { useQuery } from '@tanstack/react-query';
import { getMyMentorProfile } from '../../utils/api';
import useAuthStore from '../../stores/authStore';

const fetchMyProfile = async () => {
  const res = await getMyMentorProfile();
  return res?.data?.data ?? null;
};

export const useMyMentorProfile = () => {
  const isLoggedIn = useAuthStore((state) => Boolean(state.user?.id));
  return useQuery({
    queryKey: ['mentorship', 'mentor', 'me', 'profile'],
    queryFn: fetchMyProfile,
    retry: false,
    enabled: isLoggedIn,
  });
};
