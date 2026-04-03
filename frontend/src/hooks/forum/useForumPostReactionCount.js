import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchForumPostReactionCount = async ({ queryKey }) => {
  const [, { postId }] = queryKey;

  if (!postId) {
    return { likes: 0 };
  }

  const res = await apiClient.get(`/forum/post/${postId}/reactions/count`);
  const data = res?.data?.data ?? {};

  return {
    likes: typeof data.likes === "number" ? data.likes : 0,
  };
};

export const useForumPostReactionCount = (postId) => {
  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["forumPostReactionCount", { postId }],
    queryFn: fetchForumPostReactionCount,
    enabled: !!postId,
  });

  const likes = data?.likes ?? 0;
  const errorMessage =
    isError && error
      ? error.response?.data?.message ??
        error.message ??
        "Không thể tải số lượt thích"
      : null;

  return { likes, isPending, isError, errorMessage };
};

