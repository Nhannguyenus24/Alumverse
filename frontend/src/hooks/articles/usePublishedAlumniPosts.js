import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeNews } from "./normalizeArticle";
import useOrganizationStore from "../../stores/organizationStore";

const toAlumniArticle = (item) => {
  const normalized = normalizeNews(item);
  return normalized ? { ...normalized, channel: "alumni" } : null;
};

const fetchPublishedAlumniPosts = async ({ queryKey }) => {
  const [, { page, limit, organizationId, filters }] = queryKey;
  if (!organizationId) return { featured: null, items: [] };
  const params = { page, limit, organizationId };
  if (filters.q) params.q = filters.q;
  if (filters.topics.length) params.topics = filters.topics.join(',');
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (filters.direction !== 'newest') params.direction = filters.direction;
  const res = await apiClient.get("/articles/alumni-posts/published", {
    params,
  });
  return res?.data?.data ?? { featured: null, items: [] };
};

export const usePublishedAlumniPosts = (page = 0, limit = 10, filterOptions = {}) => {
  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);
  const filters = {
    q: String(filterOptions.q ?? '').trim(),
    topics: Array.isArray(filterOptions.topics) ? filterOptions.topics : [],
    fromDate: filterOptions.fromDate ?? '',
    toDate: filterOptions.toDate ?? '',
    direction: filterOptions.direction === 'oldest' ? 'oldest' : 'newest',
  };

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedAlumniPosts", { page, limit, organizationId, filters }],
    queryFn: fetchPublishedAlumniPosts,
    enabled: !!organizationId,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load alumni posts"
      : null;

  return {
    featured: toAlumniArticle(data?.featured),
    articles: (data?.items ?? []).map(toAlumniArticle),
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
