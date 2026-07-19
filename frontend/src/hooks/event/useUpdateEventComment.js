import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const updateEventComment = async ({ eventId, commentId, payload }) => {
  const res = await apiClient.put(`/events/${eventId}/comments/${commentId}`, payload);
  return res?.data?.data ?? null;
};

export const useUpdateEventComment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: updateEventComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventComments"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to update comment"
      : null;

  return { updateComment: mutateAsync, isPending, isError, errorMessage };
};
