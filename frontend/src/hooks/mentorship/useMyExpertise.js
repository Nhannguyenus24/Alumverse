import { useQuery } from '@tanstack/react-query';
import { getMyExpertise } from '../../utils/api';

const fetchMyExpertise = async () => {
  const res = await getMyExpertise();
  return res?.data?.data ?? [];
};

export const useMyExpertise = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['mentorship', 'mentor', 'me', 'expertise'],
    queryFn: fetchMyExpertise,
    enabled,
  });
