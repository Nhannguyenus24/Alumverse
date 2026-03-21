import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchForumPostUserReaction = async ({ queryKey }) => {
  const [, { postId, memberId }] = queryKey;

  if (!postId || !memberId) {
    return null;
  }

  try {
    const res = await apiClient.get(`/forum/post/${postId}/reactions/user`, {
      params: { memberId },
    });

    return res?.data?.data ?? null;
  } catch (error) {
    if (error?.response?.status === 404) {
      // No reaction for this user/post
      return null;
    }
    throw error;
  }
};

export const useForumPostUserReaction = (postId, memberId) => {
  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["forumPostUserReaction", { postId, memberId }],
    queryFn: fetchForumPostUserReaction,
    enabled: !!postId && !!memberId,
  });

  const hasReaction = !!data;

  const errorMessage =
    isError && error
      ? error.response?.data?.message ??
        error.message ??
        "Không thể tải trạng thái cảm xúc"
      : null;

  return { reaction: data, hasReaction, isPending, isError, errorMessage };
};

