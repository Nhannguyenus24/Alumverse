import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeNews } from "./normalizeArticle";
import useOrganizationStore from "../../stores/organizationStore";

const fetchPublishedAlumniPosts = async ({ queryKey }) => {
  const [, { page, limit, organizationId }] = queryKey;
  if (!organizationId) return { items: [], pageInfo: null };
  const res = await apiClient.get("/articles/alumni-posts/published", {
    params: { page, limit, organizationId },
  });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedAlumniPosts = (page = 0, limit = 10) => {
  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedAlumniPosts", { page, limit, organizationId }],
    queryFn: fetchPublishedAlumniPosts,
    enabled: !!organizationId,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load alumni posts"
      : null;

  return {
    articles: (data?.items ?? []).map((item) => ({
      ...normalizeNews(item),
      channel: "alumni",
    })),
    pageInfo: data?.pageInfo ?? null,
    isPending,
    isError,
    errorMessage,
  };
};
