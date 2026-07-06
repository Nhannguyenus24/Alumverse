import { useQuery } from '@tanstack/react-query';
import { filterMentors, getApprovedMentors, searchMentors } from '../../utils/api';

const fetchPage = async ({
  keyword,
  skillIds,
  minRating,
  hasAvailability,
  availableFrom,
  availableTo,
  page,
  limit,
}) => {
  const trimmedKeyword = keyword?.trim();
  const hasSkillFilter = Array.isArray(skillIds) && skillIds.length > 0;
  const hasAdvanced =
    hasSkillFilter ||
    minRating != null ||
    hasAvailability ||
    Boolean(availableFrom) ||
    Boolean(availableTo);

  let res;
  if (hasAdvanced) {
    res = await filterMentors({
      search: trimmedKeyword || undefined,
      skillIds: hasSkillFilter ? skillIds : undefined,
      minRating: minRating ?? undefined,
      hasAvailability: hasAvailability || undefined,
      availableFrom: availableFrom || undefined,
      availableTo: availableTo || undefined,
      page,
      limit,
    });
  } else if (trimmedKeyword) {
    res = await searchMentors(trimmedKeyword, page, limit);
  } else {
    res = await getApprovedMentors(page, limit);
  }
  return res?.data?.data ?? null;
};

/**
 * params: { keyword?, skillIds?, minRating?, hasAvailability?, availableFrom?, availableTo?, page?, limit? }
 * - keyword + no advanced filters → /mentors/search
 * - any advanced filter set (skillIds, minRating, hasAvailability, time window) → /mentors/filter
 * - else → /mentors (approved list)
 */
export const useBrowseMentors = ({
  keyword = '',
  skillIds = [],
  minRating = null,
  hasAvailability = false,
  availableFrom = '',
  availableTo = '',
  page = 0,
  limit = 9,
  enabled = true,
} = {}) =>
  useQuery({
    queryKey: [
      'mentorship',
      'browse',
      {
        keyword: keyword.trim(),
        skillIds: [...skillIds].sort(),
        minRating,
        hasAvailability,
        availableFrom,
        availableTo,
        page,
        limit,
      },
    ],
    queryFn: () =>
      fetchPage({
        keyword,
        skillIds,
        minRating,
        hasAvailability,
        availableFrom,
        availableTo,
        page,
        limit,
      }),
    enabled,
    keepPreviousData: true,
  });
