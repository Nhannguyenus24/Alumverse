import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchForumCategories = async ({ queryKey }) => {
  const [, { organizationId }] = queryKey;
  if (!organizationId) {
    return [];
  }
  const res = await apiClient.get("/forum/category", {
    params: { organizationId },
  });
  const data = res?.data?.data ?? [];
  return Array.isArray(data) ? data : [];
};

export const useForumCategories = (organizationId) => {
  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["forumCategories", { organizationId }],
    queryFn: fetchForumCategories,
    enabled: !!organizationId,
  });

  const categories = data ?? [];
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load categories"
      : null;

  return { categories, isPending, isError, errorMessage };
};

