import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const answerToForumPost = async ({ postId, payload }) => {
  const res = await apiClient.post(`/forum/post/${postId}/answer`, payload);
  return res?.data?.data ?? null;
};

export const useAnswerToForumPost = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: answerToForumPost,
    onSuccess: (createdPost) => {
      const topicId = createdPost?.topicId;
      if (topicId != null) {
        queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      }
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ??
        error.message ??
        "Failed to reply to post"
      : null;

  return { answerToPost: mutateAsync, isPending, isError, errorMessage };
};

