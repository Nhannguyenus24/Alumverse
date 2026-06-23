import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const deleteForumTopic = async (topicId) => {
  await apiClient.delete(`/forum/topic/${topicId}`);
  return topicId;
};

export const useDeleteForumTopic = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: deleteForumTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumTopics"] });
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to delete topic"
      : null;

  return { deleteTopic: mutateAsync, isPending, isError, errorMessage };
};
