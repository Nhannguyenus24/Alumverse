import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const updateNewsComment = async ({ newsId, commentId, payload }) => {
  const res = await apiClient.put(`/articles/news/${newsId}/comments/${commentId}`, payload);
  return res?.data?.data ?? null;
};

export const useUpdateNewsComment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: updateNewsComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsComments"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to update comment"
      : null;

  return { updateComment: mutateAsync, isPending, isError, errorMessage };
};
