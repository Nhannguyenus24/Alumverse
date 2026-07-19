import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createAlumniPostComment = async ({ alumniPostId, payload }) => {
  const res = await apiClient.post(`/articles/alumni-posts/${alumniPostId}/comments`, payload);
  return res?.data?.data ?? null;
};

export const useCreateAlumniPostComment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: createAlumniPostComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumniPostComments"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to create comment"
      : null;

  return { createComment: mutateAsync, isPending, isError, errorMessage };
};
