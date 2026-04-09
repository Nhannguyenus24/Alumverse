import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const updateForumPost = async ({ postId, payload }) => {
  const response = await apiClient.put(`/forum/post/${postId}`, payload);
  return response.data.data;
};

export const useUpdateForumPost = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: updateForumPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể cập nhật bài viết"
      : null;

  return { updatePost: mutateAsync, isPending, isError, errorMessage };
};
