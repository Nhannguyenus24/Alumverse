import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchForumTopics = async ({ queryKey }) => {
  const [, { categoryId, page, size }] = queryKey;
  if (!categoryId) {
    return [];
  }

  const res = await apiClient.get("/forum/topic", {
    params: { categoryId, page, size },
  });

  const items = res?.data?.data?.items ?? [];
  return Array.isArray(items) ? items : [];
};

export const useForumTopics = (categoryId, page = 0, size = 10) => {
  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["forumTopics", { categoryId, page, size }],
    queryFn: fetchForumTopics,
    enabled: !!categoryId,
  });

  const topics = data ?? [];
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải danh sách chủ đề"
      : null;

  return { topics, isPending, isError, errorMessage };
};

