import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const createAlumniPost = async (payload) => {
  const res = await apiClient.post("/articles/alumni-posts", payload);
  return res?.data?.data ?? null;
};

export const useCreateAlumniPost = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: createAlumniPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publishedAlumniPosts"] });
    },
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tạo bài viết"
      : null;

  return { createAlumniPost: mutateAsync, isPending, isError, errorMessage };
};
