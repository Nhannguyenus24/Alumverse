import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import useOrganizationStore from "../../stores/organizationStore";

const fetchPublishedNews = async ({ queryKey }) => {
  const [, { page, limit, organizationId, filters }] = queryKey;
  if (!organizationId) return { featured: null, items: [] };
  const params = { page, limit, organizationId };
  if (filters.keyword) params.keyword = filters.keyword;
  if (filters.topics.length) params.topics = filters.topics.join(',');
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (filters.sort !== 'newest') params.sort = filters.sort;

  const res = await apiClient.get("/articles/news/published", {
    params,
  });
  return res?.data?.data ?? { featured: null, items: [] };
};

export const usePublishedNews = (page = 0, limit = 15, filterOptions = {}) => {
  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);
  const filters = {
    keyword: String(filterOptions.keyword ?? '').trim(),
    topics: Array.isArray(filterOptions.topics) ? filterOptions.topics : [],
    fromDate: filterOptions.fromDate ?? '',
    toDate: filterOptions.toDate ?? '',
    sort: filterOptions.sort === 'oldest' ? 'oldest' : 'newest',
  };
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedNews", { page, limit, organizationId, filters }],
    queryFn: fetchPublishedNews,
    enabled: !!organizationId,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load news"
      : null;

  return {
    featured: data?.featured ?? null,
    news: data?.items ?? [],
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
