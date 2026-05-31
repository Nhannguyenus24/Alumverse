import { useQuery } from '@tanstack/react-query';
import { filterMentors, getApprovedMentors, searchMentors } from '../../api/mentorshipApi';

const fetchPage = async ({
  keyword,
  category,
  expertise,
  minRating,
  hasAvailability,
  availableFrom,
  availableTo,
  page,
  limit,
}) => {
  const trimmedKeyword = keyword?.trim();
  const trimmedCategory = category?.trim();
  const trimmedExpertise = expertise?.trim();
  const hasAdvanced =
    Boolean(trimmedCategory) ||
    Boolean(trimmedExpertise) ||
    minRating != null ||
    hasAvailability ||
    Boolean(availableFrom) ||
    Boolean(availableTo);

  let res;
  if (hasAdvanced) {
    res = await filterMentors({
      search: trimmedKeyword || undefined,
      category: trimmedCategory || undefined,
      expertise: trimmedExpertise || undefined,
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
 * params: { keyword?, category?, expertise?, minRating?, hasAvailability?, availableFrom?, availableTo?, page?, limit? }
 * - keyword + no advanced filters → /mentors/search
 * - any advanced filter set (category, expertise, minRating, hasAvailability, time window) → /mentors/filter
 * - else → /mentors (approved list)
 */
export const useBrowseMentors = ({
  keyword = '',
  category = '',
  expertise = '',
  minRating = null,
  hasAvailability = false,
  availableFrom = '',
  availableTo = '',
  page = 0,
  limit = 9,
} = {}) =>
  useQuery({
    queryKey: [
      'mentorship',
      'browse',
      {
        keyword: keyword.trim(),
        category: category.trim(),
        expertise: expertise.trim(),
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
        category,
        expertise,
        minRating,
        hasAvailability,
        availableFrom,
        availableTo,
        page,
        limit,
      }),
    keepPreviousData: true,
  });
