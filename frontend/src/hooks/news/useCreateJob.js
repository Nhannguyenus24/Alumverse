import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createJob = async (payload) => {
  const res = await apiClient.post("/articles/jobs", payload);
  return res?.data?.data ?? null;
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to create job"
      : null;

  return { createJob: mutateAsync, isPending, isError, errorMessage };
};
