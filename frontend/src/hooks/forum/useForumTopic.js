import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchForumTopic = async ({ queryKey }) => {
  const [, { topicId }] = queryKey;
  if (!topicId) {
    return null;
  }

  const res = await apiClient.get(`/forum/topic/${topicId}`);

  return res?.data?.data ?? null;
};

export const useForumTopic = (topicId) => {
  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["forumTopic", { topicId }],
    queryFn: fetchForumTopic,
    enabled: !!topicId,
  });

  const topic = data ?? null;
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load topic"
      : null;

  return { topic, isPending, isError, errorMessage };
};
