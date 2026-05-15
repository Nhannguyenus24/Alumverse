import { useQuery } from '@tanstack/react-query';
import { getMyAvailabilities } from '../../api/mentorshipApi';

const fetchAvailabilities = async () => {
  const res = await getMyAvailabilities();
  return res?.data?.data ?? [];
};

export const useMyAvailabilities = () =>
  useQuery({
    queryKey: ['mentorship', 'mentor', 'me', 'availabilities'],
    queryFn: fetchAvailabilities,
  });
