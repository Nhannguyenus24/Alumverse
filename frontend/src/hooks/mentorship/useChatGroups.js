import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchChatGroups = async ({ queryKey }) => {
  const [, { type }] = queryKey;
  if (!type) return [];

  const res = await apiClient.get("/chat/groups", {
    params: { type },
  });

  const data = res?.data?.data ?? [];
  return Array.isArray(data) ? data : [];
};

export const useChatGroups = (type = "PRIVATE") => {
  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["chatGroups", { type }],
    queryFn: fetchChatGroups,
    enabled: !!type,
  });

  const chatGroups = data ?? [];
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Unable to load chat groups"
      : null;

  return { chatGroups, isPending, isError, errorMessage };
};

