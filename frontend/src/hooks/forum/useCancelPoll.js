import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const closePoll = async (pollId) => {
  const res = await apiClient.put(`/forum/poll/${pollId}/close`);
  return res?.data?.data ?? null;
};

const deletePoll = async (pollId) => {
  const res = await apiClient.delete(`/forum/poll/${pollId}`);
  return res?.data?.data ?? null;
};

export const useClosePoll = () => {
  const queryClient = useQueryClient();

  const {
    mutate: closePollMutate,
    mutateAsync: closePollAsync,
    isPending,
    isError,
    error,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: closePoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poll"] });
      queryClient.invalidateQueries({ queryKey: ["pollsByTopic"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể đóng poll"
      : null;

  return {
    closePoll: closePollMutate,
    closePollAsync,
    isPending,
    isError,
    errorMessage,
    isSuccess,
    reset,
  };
};

export const useDeletePoll = () => {
  const queryClient = useQueryClient();

  const {
    mutate: deletePollMutate,
    mutateAsync: deletePollAsync,
    isPending,
    isError,
    error,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: deletePoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poll"] });
      queryClient.invalidateQueries({ queryKey: ["pollsByTopic"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể xóa poll"
      : null;

  return {
    deletePoll: deletePollMutate,
    deletePollAsync,
    isPending,
    isError,
    errorMessage,
    isSuccess,
    reset,
  };
};
