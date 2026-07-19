import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import useOrganizationStore from "../../stores/organizationStore";

const fetchPublishedNews = async ({ queryKey }) => {
  const [, { page, limit, organizationId }] = queryKey;
  if (!organizationId) return { items: [], pageInfo: null };
  const res = await apiClient.get("/articles/news/published", {
    params: { page, limit, organizationId },
  });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedNews = (page = 0, limit = 10) => {
  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedNews", { page, limit, organizationId }],
    queryFn: fetchPublishedNews,
    enabled: !!organizationId,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load news"
      : null;

  return {
    news: data?.items ?? [],
    pageInfo: data?.pageInfo ?? null,
    isPending,
    isError,
    errorMessage,
  };
};
