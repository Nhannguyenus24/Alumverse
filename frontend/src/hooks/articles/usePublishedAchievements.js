import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeAchievement } from "./normalizeArticle";
import useOrganizationStore from "../../stores/organizationStore";

const fetchAchievements = async ({ queryKey }) => {
  const [, { page, limit, organizationId, filters }] = queryKey;
  if (!organizationId) return { featured: null, items: [] };
  const params = { page, limit, organizationId };
  if (filters.q) params.q = filters.q;
  if (filters.topics.length) params.topics = filters.topics.join(',');
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (filters.sortBy !== 'updated') params.sortBy = filters.sortBy;
  if (filters.direction !== 'newest') params.direction = filters.direction;
  const res = await apiClient.get("/articles/achievements", {
    params,
  });
  return res?.data?.data ?? { featured: null, items: [] };
};

export const usePublishedAchievements = (page = 0, limit = 10, filterOptions = {}) => {
  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);
  const filters = {
    q: String(filterOptions.q ?? '').trim(),
    topics: Array.isArray(filterOptions.topics) ? filterOptions.topics : [],
    fromDate: filterOptions.fromDate ?? '',
    toDate: filterOptions.toDate ?? '',
    // 'updated' matches what the cards display and what the honors pages sorted on client-side;
    // 'awarded' keys on awarded_date, which is the order the home page showed before.
    sortBy: filterOptions.sortBy === 'awarded' ? 'awarded' : 'updated',
    direction: filterOptions.direction === 'oldest' ? 'oldest' : 'newest',
  };

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedAchievements", { page, limit, organizationId, filters }],
    queryFn: fetchAchievements,
    enabled: !!organizationId,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load achievements"
      : null;

  return {
    featured: normalizeAchievement(data?.featured),
    achievements: (data?.items ?? []).map(normalizeAchievement),
    pageInfo: data ? {
      currentPage: data.currentPage ?? 0,
      pageSize: data.pageSize ?? limit,
      totalPage: data.totalPage ?? 0,
      totalItem: data.totalItem ?? 0,
      hasNext: data.hasNext ?? false,
      hasPrevious: data.hasPrevious ?? false,
    } : null,
    isPending,
    isError,
    errorMessage,
  };
};
