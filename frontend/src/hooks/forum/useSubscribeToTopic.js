import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const subscribeToTopic = async ({ topicId, memberId }) => {
  const res = await apiClient.post("/forum/topic/subscribe", {
    topicId,
    memberId,
  });
  return res.data;
};

export const useSubscribeToTopic = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: toggleSubscription,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: subscribeToTopic,
    onSuccess: (_, { topicId }) => {
      queryClient.invalidateQueries({ queryKey: ["forumTopicSubscriptionStatus", topicId] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể cập nhật theo dõi"
      : null;

  return { toggleSubscription, isPending, isError, errorMessage };
};
