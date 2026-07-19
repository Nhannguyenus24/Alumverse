import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createNewsComment = async ({ newsId, payload }) => {
  const res = await apiClient.post(`/articles/news/${newsId}/comments`, payload);
  return res?.data?.data ?? null;
};

export const useCreateNewsComment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: createNewsComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsComments"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to create comment"
      : null;

  return { createComment: mutateAsync, isPending, isError, errorMessage };
};
