import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeNews } from "./normalizeArticle";

const fetchPublishedAlumniPosts = async ({ queryKey }) => {
  const [, { page, limit }] = queryKey;
  const res = await apiClient.get("/articles/alumni-posts/published", {
    params: { page, limit },
  });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedAlumniPosts = (page = 0, limit = 10) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedAlumniPosts", { page, limit }],
    queryFn: fetchPublishedAlumniPosts,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải danh sách bài viết cựu sinh viên"
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
