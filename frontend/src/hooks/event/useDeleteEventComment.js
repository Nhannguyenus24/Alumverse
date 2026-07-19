import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const deleteEventComment = async ({ eventId, commentId }) => {
  await apiClient.delete(`/events/${eventId}/comments/${commentId}`);
  return commentId;
};

export const useDeleteEventComment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: deleteEventComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventComments"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to delete comment"
      : null;

  return { deleteComment: mutateAsync, isPending, isError, errorMessage };
};
