import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createNews = async (payload) => {
  const res = await apiClient.post("/articles/news", payload);
  return res?.data?.data ?? null;
};

export const useCreateNews = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: createNews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publishedNews"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to create news post"
      : null;

  return { createNews: mutateAsync, isPending, isError, errorMessage };
};
