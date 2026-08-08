import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeEvent } from "./normalizeArticle";
import useOrganizationStore from "../../stores/organizationStore";

const fetchEvents = async ({ queryKey }) => {
  const [, scope, { page, limit, organizationId, filters }] = queryKey;
  if (!organizationId) return { featured: null, items: [] };
  const path =
    scope === "past"
      ? "/events/past"
      : scope === "ongoing"
        ? "/events/ongoing"
        : "/events/upcoming";
  const params = { page, limit, organizationId };
  if (filters.keyword) params.keyword = filters.keyword;
  if (filters.topics.length) params.topics = filters.topics.join(',');
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (filters.sort !== 'status') params.sort = filters.sort;
  if (scope === 'upcoming' && filters.withFeatured) params.withFeatured = true;
  if (scope === 'ongoing' && filters.excludeFeatured) params.excludeFeatured = true;

  const res = await apiClient.get(path, { params });
  return res?.data?.data ?? { featured: null, items: [] };
};

export const usePublishedEvents = (scope = "upcoming", page = 0, limit = 10, filterOptions = {}) => {
  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);
  const filters = {
    keyword: String(filterOptions.keyword ?? '').trim(),
    topics: Array.isArray(filterOptions.topics) ? filterOptions.topics : [],
    fromDate: filterOptions.fromDate ?? '',
    toDate: filterOptions.toDate ?? '',
    sort: filterOptions.sort === 'oldest' || filterOptions.sort === 'newest'
      ? filterOptions.sort
      : 'status',
    withFeatured: Boolean(filterOptions.withFeatured),
    excludeFeatured: Boolean(filterOptions.excludeFeatured),
  };

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedEvents", scope, { page, limit, organizationId, filters }],
    queryFn: fetchEvents,
    enabled: !!organizationId,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load events"
      : null;

  return {
    featured: normalizeEvent(data?.featured),
    events: (data?.items ?? []).map(normalizeEvent),
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
