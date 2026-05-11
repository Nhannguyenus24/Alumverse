import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeAchievement } from "./normalizeArticle";

const fetchAchievements = async ({ queryKey }) => {
  const [, { page, limit }] = queryKey;
  const res = await apiClient.get("/articles/achievements", {
    params: { page, limit },
  });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedAchievements = (page = 0, limit = 10) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedAchievements", { page, limit }],
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
