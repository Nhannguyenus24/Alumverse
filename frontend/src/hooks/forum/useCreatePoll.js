import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createPoll = async (pollData) => {
  const res = await apiClient.post("/forum/poll", pollData);
  return res?.data?.data ?? null;
};

export const useCreatePoll = () => {
  const queryClient = useQueryClient();

  const {
    mutate: createPollMutate,
    mutateAsync: createPollAsync,
    isPending,
    isError,
    error,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: createPoll,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pollsByTopic"] });
      queryClient.invalidateQueries({ queryKey: ["forumTopics"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tạo poll"
      : null;

  return {
    createPoll: createPollMutate,
    createPollAsync,
    isPending,
    isError,
    errorMessage,
    isSuccess,
    reset,
  };
};
