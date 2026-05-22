import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const voteOnPoll = async (voteData) => {
  const res = await apiClient.post("/forum/poll/vote", voteData);
  return res?.data?.data ?? null;
};

export const useVoteOnPoll = () => {
  const queryClient = useQueryClient();

  const {
    mutate: voteMutate,
    mutateAsync: voteAsync,
    isPending,
    isError,
    error,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: voteOnPoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poll"] });
      queryClient.invalidateQueries({ queryKey: ["pollsByTopic"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể vote poll"
      : null;

  return {
    vote: voteMutate,
    voteAsync,
    isPending,
    isError,
    errorMessage,
    isSuccess,
    reset,
  };
};
