import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const replyToAlumniPostComment = async ({ alumniPostId, commentId, payload }) => {
  const res = await apiClient.post(
    `/articles/alumni-posts/${alumniPostId}/comments/${commentId}/reply`,
    payload
  );
  return res?.data?.data ?? null;
};

export const useReplyToAlumniPostComment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: replyToAlumniPostComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumniPostComments"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to reply to comment"
      : null;

  return { replyToComment: mutateAsync, isPending, isError, errorMessage };
};
