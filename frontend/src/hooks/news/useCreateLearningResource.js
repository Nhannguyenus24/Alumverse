import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createLearningResource = async (payload) => {
  const res = await apiClient.post("/articles/learning-resources", payload);
  return res?.data?.data ?? null;
};

export const useCreateLearningResource = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: createLearningResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learningResources"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to create learning resource"
      : null;

  return { createLearningResource: mutateAsync, isPending, isError, errorMessage };
};
