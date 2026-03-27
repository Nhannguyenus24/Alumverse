import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchChatMessages = async ({ queryKey }) => {
  const [, { groupId, page, size }] = queryKey;
  if (!groupId) return [];

  const res = await apiClient.get(`/chat/groups/${groupId}/messages`, {
    params: { page, size },
  });

  const data = res?.data?.data ?? [];
  return Array.isArray(data) ? data : [];
};

export const useChatMessages = (groupId, page = 0, size = 20) => {
  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["chatMessages", { groupId, page, size }],
    queryFn: fetchChatMessages,
    enabled: !!groupId,
  });

  const messages = data ?? [];
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Unable to load chat messages"
      : null;

  return { messages, isPending, isError, errorMessage };
};

