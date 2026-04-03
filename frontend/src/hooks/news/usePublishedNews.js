import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchPublishedNews = async ({ queryKey }) => {
  const [, { page, limit }] = queryKey;
  const res = await apiClient.get("/articles/news/published", {
    params: { page, limit },
  });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedNews = (page = 0, limit = 10) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedNews", { page, limit }],
    queryFn: fetchPublishedNews,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải danh sách bài viết"
      : null;

  return {
    news: data?.items ?? [],
    pageInfo: data?.pageInfo ?? null,
    isPending,
    isError,
    errorMessage,
  };
};
