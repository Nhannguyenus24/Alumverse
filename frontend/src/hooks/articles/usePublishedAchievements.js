import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeAchievement } from "./normalizeArticle";

const fetchAchievements = async ({ queryKey }) => {
  const [, { page, limit, status }] = queryKey;
  const url = status ? `/articles/achievements/status/${status}` : "/articles/achievements";
  const res = await apiClient.get(url, {
    params: { page, limit },
  });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedAchievements = (page = 0, limit = 10, status = "APPROVED") => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedAchievements", { page, limit, status }],
    queryFn: fetchAchievements,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải danh sách thành tựu"
      : null;

  return {
    achievements: (data?.items ?? []).map(normalizeAchievement),
    pageInfo: data?.pageInfo ?? null,
    isPending,
    isError,
    errorMessage,
  };
};
