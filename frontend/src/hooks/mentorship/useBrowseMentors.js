import { useQuery } from '@tanstack/react-query';
import { filterMentors, getApprovedMentors, searchMentors } from '../../api/mentorshipApi';

const fetchPage = async ({ keyword, expertise, minRating, hasAvailability, page, limit }) => {
  const trimmedKeyword = keyword?.trim();
  const trimmedExpertise = expertise?.trim();
  const hasAdvanced = Boolean(trimmedExpertise) || minRating != null || hasAvailability;

  let res;
  if (hasAdvanced) {
    res = await filterMentors({
      search: trimmedKeyword || undefined,
      expertise: trimmedExpertise || undefined,
      minRating: minRating ?? undefined,
      hasAvailability: hasAvailability || undefined,
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
 * params: { keyword?, expertise?, minRating?, hasAvailability?, page?, limit? }
 * - keyword + no advanced filters → /mentors/search
 * - any advanced filter set → /mentors/filter
 * - else → /mentors (approved list)
 */
export const useBrowseMentors = ({
  keyword = '',
  expertise = '',
  minRating = null,
  hasAvailability = false,
  page = 0,
  limit = 9,
} = {}) =>
  useQuery({
    queryKey: [
      'mentorship',
      'browse',
      { keyword: keyword.trim(), expertise: expertise.trim(), minRating, hasAvailability, page, limit },
    ],
    queryFn: () => fetchPage({ keyword, expertise, minRating, hasAvailability, page, limit }),
    keepPreviousData: true,
  });
