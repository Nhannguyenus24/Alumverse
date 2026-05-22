import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const removePollVote = async ({ pollId, memberId }) => {
  const res = await apiClient.delete(`/forum/poll/vote/${pollId}`, {
    params: { memberId },
  });
  return res?.data?.data ?? null;
};

export const useRemovePollVote = () => {
  const queryClient = useQueryClient();

  const {
    mutate: removeVoteMutate,
    mutateAsync: removeVoteAsync,
    isPending,
    isError,
    error,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: removePollVote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poll"] });
      queryClient.invalidateQueries({ queryKey: ["pollsByTopic"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể xóa vote"
      : null;

  return {
    removeVote: removeVoteMutate,
    removeVoteAsync,
    isPending,
    isError,
    errorMessage,
    isSuccess,
    reset,
  };
};
