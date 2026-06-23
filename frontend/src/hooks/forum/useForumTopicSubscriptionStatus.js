import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchSubscriptionStatus = async ({ queryKey }) => {
  const [, { topicId, memberId }] = queryKey;
  if (!topicId || !memberId) {
    return false;
  }

  const res = await apiClient.get(`/forum/topic/${topicId}/is-subscribed`, {
    params: { memberId },
  });

  return !!res?.data?.data;
};

export const useForumTopicSubscriptionStatus = (topicId, memberId) => {
  const {
    data: isSubscribed,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["forumTopicSubscriptionStatus", { topicId, memberId }],
    queryFn: fetchSubscriptionStatus,
    enabled: !!topicId && !!memberId,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load subscription status"
      : null;

  return { isSubscribed: !!isSubscribed, isPending, isError, errorMessage };
};
