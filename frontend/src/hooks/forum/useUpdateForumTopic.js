import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const updateForumTopic = async ({ topicId, payload }) => {
  const res = await apiClient.put(`/forum/topic/${topicId}`, payload);
  return res?.data?.data ?? null;
};

export const useUpdateForumTopic = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: updateForumTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumTopics"] });
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể cập nhật chủ đề"
      : null;

  return { updateTopic: mutateAsync, isPending, isError, errorMessage };
};
