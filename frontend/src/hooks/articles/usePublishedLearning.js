import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeLearning } from "./normalizeArticle";
import useOrganizationStore from "../../stores/organizationStore";

const fetchLearning = async ({ queryKey }) => {
  const [, { page, limit, organizationId }] = queryKey;
  if (!organizationId) return { items: [], pageInfo: null };
  const res = await apiClient.get("/articles/learning-resources", {
    params: { page, limit, organizationId },
  });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedLearning = (page = 0, limit = 10) => {
  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedLearning", { page, limit, organizationId }],
    queryFn: fetchLearning,
    enabled: !!organizationId,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load learning resources"
      : null;

  return {
    resources: (data?.items ?? []).map(normalizeLearning),
    pageInfo: data?.pageInfo ?? null,
    isPending,
    isError,
    errorMessage,
  };
};
