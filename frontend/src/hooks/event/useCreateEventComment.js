import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createEventComment = async ({ eventId, payload }) => {
  const res = await apiClient.post(`/events/${eventId}/comments`, payload);
  return res?.data?.data ?? null;
};

export const useCreateEventComment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: createEventComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventComments"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to create comment"
      : null;

  return { createComment: mutateAsync, isPending, isError, errorMessage };
};
