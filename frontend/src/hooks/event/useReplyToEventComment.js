import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const replyToEventComment = async ({ eventId, commentId, payload }) => {
  const res = await apiClient.post(`/events/${eventId}/comments/${commentId}/reply`, payload);
  return res?.data?.data ?? null;
};

export const useReplyToEventComment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: replyToEventComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventComments"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to reply to comment"
      : null;

  return { replyToComment: mutateAsync, isPending, isError, errorMessage };
};
