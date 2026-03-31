import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchPrivateChats = async () => {
  const res = await apiClient.get("/chat/private/list");
  const data = res?.data?.data ?? [];
  return Array.isArray(data) ? data : [];
};

export const usePrivateChats = () => {
  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["privateChats"],
    queryFn: fetchPrivateChats,
  });

  const privateChats = data ?? [];
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Unable to load private chats"
      : null;

  return { privateChats, isPending, isError, errorMessage };
};
