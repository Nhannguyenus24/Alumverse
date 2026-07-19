import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const updateAlumniPostComment = async ({ alumniPostId, commentId, payload }) => {
  const res = await apiClient.put(
    `/articles/alumni-posts/${alumniPostId}/comments/${commentId}`,
    payload
  );
  return res?.data?.data ?? null;
};

export const useUpdateAlumniPostComment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: updateAlumniPostComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumniPostComments"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to update comment"
      : null;

  return { updateComment: mutateAsync, isPending, isError, errorMessage };
};
