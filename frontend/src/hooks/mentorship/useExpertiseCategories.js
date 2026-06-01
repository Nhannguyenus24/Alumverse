import { useQuery } from '@tanstack/react-query';
import { getExpertiseCategories } from '../../utils/api';

const fetchCategories = async () => {
  const res = await getExpertiseCategories();
  return res?.data?.data ?? [];
};

export const useExpertiseCategories = () =>
  useQuery({
    queryKey: ['mentorship', 'expertise-categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
