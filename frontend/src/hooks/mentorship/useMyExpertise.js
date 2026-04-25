import { useQuery } from '@tanstack/react-query';
import { getMyExpertise } from '../../api/mentorshipApi';

const fetchMyExpertise = async () => {
  const res = await getMyExpertise();
  return res?.data?.data ?? [];
};

export const useMyExpertise = () =>
  useQuery({
    queryKey: ['mentorship', 'mentor', 'me', 'expertise'],
    queryFn: fetchMyExpertise,
  });
