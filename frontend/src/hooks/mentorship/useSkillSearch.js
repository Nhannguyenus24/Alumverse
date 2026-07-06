import { useQuery } from '@tanstack/react-query';
import { searchSkills } from '../../utils/api';

const fetchSkills = async (search) => {
  const res = await searchSkills({ search: search || undefined, page: 0, limit: 20 });
  return res?.data?.data?.items ?? [];
};

/**
 * Skill catalog lookup used by the "filter by skill" multi-select: options are
 * skills that already exist in the system (skills table), %LIKE% search,
 * sorted A-Z by the backend.
 */
export const useSkillSearch = (search, { enabled = true } = {}) =>
  useQuery({
    queryKey: ['mentorship', 'skills', search || ''],
    queryFn: () => fetchSkills(search),
    staleTime: 60 * 1000,
    enabled,
  });
