import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeLearning } from "./normalizeArticle";

const fetchLearning = async ({ queryKey }) => {
  const [, { page, limit }] = queryKey;
  const res = await apiClient.get("/articles/learning-resources", {
    params: { page, limit },
  });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedLearning = (page = 0, limit = 10) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedLearning", { page, limit }],
    queryFn: fetchLearning,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải danh sách học tập"
      : null;

  return {
    resources: (data?.items ?? []).map(normalizeLearning),
    pageInfo: data?.pageInfo ?? null,
    isPending,
    isError,
    errorMessage,
  };
};
