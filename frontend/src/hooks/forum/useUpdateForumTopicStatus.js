import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

// Admin-only: change a topic's moderation status (ACTIVE / INACTIVE / PENDING).
const updateForumTopicStatus = async ({ topicId, status }) => {
  const res = await apiClient.put(`/admin/forum/admin/topics/${topicId}/status`, { status });
  return res?.data?.data ?? null;
};

export const useUpdateForumTopicStatus = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: updateForumTopicStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumTopics"] });
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to update topic status"
      : null;

  return { updateTopicStatus: mutateAsync, isPending, isError, errorMessage };
};
