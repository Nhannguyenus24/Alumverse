import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchForumPosts = async ({ queryKey }) => {
  const [, { topicId, page, size, memberId }] = queryKey;
  if (!topicId) {
    return { items: [], pageInfo: null };
  }

  const res = await apiClient.get("/forum/post", {
    params: { topicId, page, size, memberId },
  });

  const data = res?.data?.data ?? {};
  const items = data?.items ?? [];
  const pageInfo = data?.pageInfo ?? null;

  return {
    items: Array.isArray(items) ? items : [],
    pageInfo,
  };
};

export const useForumPosts = (topicId, memberId, page = 0, size = 20) => {
  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["forumPosts", { topicId, page, size, memberId }],
    queryFn: fetchForumPosts,
    enabled: !!topicId,
  });

  const posts = data?.items ?? [];
  const pageInfo = data?.pageInfo ?? null;
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải bài viết"
      : null;

  return { posts, pageInfo, isPending, isError, errorMessage };
};
