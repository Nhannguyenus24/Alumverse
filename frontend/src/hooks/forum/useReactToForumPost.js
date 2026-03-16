import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const reactToForumPost = async ({ postId, memberId }) => {
  if (!postId || !memberId) {
    throw new Error("Thiếu thông tin bài viết hoặc người dùng");
  }

  const res = await apiClient.post("/forum/post/react", {
    postId,
    memberId,
  });

  return res?.data ?? null;
};

export const useReactToForumPost = (postId, memberId) => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: reactToForumPost,
    onSuccess: (_, variables) => {
      const targetPostId = variables?.postId ?? postId;
      const targetMemberId = variables?.memberId ?? memberId;

      if (targetPostId != null) {
        queryClient.invalidateQueries({
          queryKey: ["forumPostReactionCount", { postId: targetPostId }],
        });
      }

      if (targetPostId != null && targetMemberId != null) {
        queryClient.invalidateQueries({
          queryKey: ["forumPostUserReaction", { postId: targetPostId, memberId: targetMemberId }],
        });
      }
    },
  });

  const toggleReaction = useCallback(
    () => mutateAsync({ postId, memberId }),
    [mutateAsync, postId, memberId]
  );

  const errorMessage =
    isError && error
      ? error.response?.data?.message ??
        error.message ??
        "Không thể cập nhật cảm xúc"
      : null;

  return {
    toggleReaction,
    isPending,
    isError,
    errorMessage,
  };
};

