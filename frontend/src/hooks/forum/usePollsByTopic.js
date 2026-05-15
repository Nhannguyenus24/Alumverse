import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchPollsByTopic = async ({ queryKey }) => {
  const [, { topicId, memberId }] = queryKey;
  if (!topicId) {
    return [];
  }

  const res = await apiClient.get(`/forum/poll/topic/${topicId}`, {
    params: { memberId },
  });

  const data = res?.data?.data ?? [];
  return Array.isArray(data) ? data : [];
};

export const usePollsByTopic = (topicId, memberId) => {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["pollsByTopic", { topicId, memberId }],
    queryFn: fetchPollsByTopic,
    enabled: !!topicId,
  });

  const polls = data ?? [];
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải polls"
      : null;

  return {
    polls,
    isPending,
    isError,
    errorMessage,
    refetch,
  };
};
