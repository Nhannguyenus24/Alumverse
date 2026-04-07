import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const deleteForumPost = async (postId) => {
  await apiClient.delete(`/forum/post/${postId}`);
  return postId;
};

export const useDeleteForumPost = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: deleteForumPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể xóa bài viết"
      : null;

  return { deletePost: mutateAsync, isPending, isError, errorMessage };
};
