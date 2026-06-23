import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createForumPost = async (payload) => {
  const res = await apiClient.post("/forum/post", payload);
  return res?.data?.data ?? null;
};

export const useCreateForumPost = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: createForumPost,
    onSuccess: (createdPost) => {
      const topicId = createdPost?.topicId;
      if (topicId != null) {
        queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      }
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to create post"
      : null;

  return { createPost: mutateAsync, isPending, isError, errorMessage };
};
