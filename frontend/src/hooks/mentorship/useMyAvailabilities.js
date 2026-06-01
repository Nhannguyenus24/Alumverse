import { useQuery } from '@tanstack/react-query';
import { getMyAvailabilities } from '../../utils/api';

const fetchAvailabilities = async () => {
  const res = await getMyAvailabilities();
  return res?.data?.data ?? [];
};

export const useMyAvailabilities = () =>
  useQuery({
    queryKey: ['mentorship', 'mentor', 'me', 'availabilities'],
    queryFn: fetchAvailabilities,
  });
