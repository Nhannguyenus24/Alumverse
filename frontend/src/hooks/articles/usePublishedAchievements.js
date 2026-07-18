import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeAchievement } from "./normalizeArticle";
import useOrganizationStore from "../../stores/organizationStore";

const fetchAchievements = async ({ queryKey }) => {
  const [, { page, limit, status, organizationId }] = queryKey;
  if (!organizationId) return { items: [], pageInfo: null };
  const url = status ? `/articles/achievements/status/${status}` : "/articles/achievements";
  const res = await apiClient.get(url, {
    params: { page, limit, organizationId },
  });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedAchievements = (page = 0, limit = 10, status = "APPROVED") => {
  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedAchievements", { page, limit, status, organizationId }],
    queryFn: fetchAchievements,
    enabled: !!organizationId,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load achievements"
      : null;

  return {
    achievements: (data?.items ?? []).map(normalizeAchievement),
    pageInfo: data?.pageInfo ?? null,
    isPending,
    isError,
    errorMessage,
  };
};
