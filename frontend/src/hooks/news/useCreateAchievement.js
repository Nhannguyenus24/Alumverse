import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createAchievement = async (payload) => {
  const res = await apiClient.post("/articles/achievements", payload);
  return res?.data?.data ?? null;
};

export const useCreateAchievement = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: createAchievement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to create achievement"
      : null;

  return { createAchievement: mutateAsync, isPending, isError, errorMessage };
};
