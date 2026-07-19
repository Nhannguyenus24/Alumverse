import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const deleteAlumniPostComment = async ({ alumniPostId, commentId }) => {
  await apiClient.delete(`/articles/alumni-posts/${alumniPostId}/comments/${commentId}`);
  return commentId;
};

export const useDeleteAlumniPostComment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: deleteAlumniPostComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumniPostComments"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to delete comment"
      : null;

  return { deleteComment: mutateAsync, isPending, isError, errorMessage };
};
