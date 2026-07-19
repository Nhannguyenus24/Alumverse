import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const replyToNewsComment = async ({ newsId, commentId, payload }) => {
  const res = await apiClient.post(`/articles/news/${newsId}/comments/${commentId}/reply`, payload);
  return res?.data?.data ?? null;
};

export const useReplyToNewsComment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: replyToNewsComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsComments"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to reply to comment"
      : null;

  return { replyToComment: mutateAsync, isPending, isError, errorMessage };
};
