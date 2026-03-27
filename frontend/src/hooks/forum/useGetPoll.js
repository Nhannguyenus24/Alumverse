import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchPoll = async ({ queryKey }) => {
  const [, { pollId, memberId }] = queryKey;
  if (!pollId) {
    return null;
  }

  const res = await apiClient.get(`/forum/poll/${pollId}`, {
    params: { memberId },
  });

  return res?.data?.data ?? null;
};

export const useGetPoll = (pollId, memberId) => {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["poll", { pollId, memberId }],
    queryFn: fetchPoll,
    enabled: !!pollId,
  });

  const poll = data ?? null;
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải poll"
      : null;

  return {
    poll,
    isPending,
    isError,
    errorMessage,
    refetch,
  };
};
