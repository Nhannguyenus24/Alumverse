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
    onSuccess: (_, { topicId, memberId }) => {
      queryClient.invalidateQueries({ queryKey: ["forumTopicSubscriptionStatus", { topicId, memberId }] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to update subscription"
      : null;

  return { toggleSubscription, isPending, isError, errorMessage };
};
