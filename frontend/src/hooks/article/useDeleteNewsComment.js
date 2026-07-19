import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const deleteNewsComment = async ({ newsId, commentId }) => {
  await apiClient.delete(`/articles/news/${newsId}/comments/${commentId}`);
  return commentId;
};

export const useDeleteNewsComment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: deleteNewsComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsComments"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to delete comment"
      : null;

  return { deleteComment: mutateAsync, isPending, isError, errorMessage };
};
