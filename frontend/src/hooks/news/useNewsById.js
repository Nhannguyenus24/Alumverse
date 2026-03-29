import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchNewsById = async ({ queryKey }) => {
  const [, { id }] = queryKey;
  const res = await apiClient.get(`/articles/news/${id}`);
  return res?.data?.data ?? null;
};

export const useNewsById = (id) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["news", { id }],
    queryFn: fetchNewsById,
    enabled: !!id,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải bài viết"
      : null;

  return { article: data, isPending, isError, errorMessage };
};
