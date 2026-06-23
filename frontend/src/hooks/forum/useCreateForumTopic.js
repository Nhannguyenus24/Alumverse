import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createForumTopic = async (payload) => {
  const res = await apiClient.post("/forum/topic", payload);
  return res?.data?.data ?? null;
};

export const useCreateForumTopic = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: createForumTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumTopics"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to create topic"
      : null;

  return { createTopic: mutateAsync, isPending, isError, errorMessage };
};
