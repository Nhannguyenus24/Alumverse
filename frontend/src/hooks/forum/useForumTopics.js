import { useQuery, useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import apiClient from "../../utils/axios";

const fetchForumTopics = async ({ queryKey }) => {
  const [, { categoryId, page, size }] = queryKey;
  if (!categoryId) {
    return [];
  }

  const res = await apiClient.get("/forum/topic", {
    params: { categoryId, page, size },
  });

  const items = res?.data?.data?.items ?? [];
  return Array.isArray(items) ? items : [];
};

export const useForumTopics = (categoryId, page = 0, size = 10) => {
  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["forumTopics", { categoryId, page, size }],
    queryFn: fetchForumTopics,
    enabled: !!categoryId,
  });

  const topics = data ?? [];
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải danh sách chủ đề"
      : null;

  return { topics, isPending, isError, errorMessage };
};

/**
 * Fetches topics for all given category IDs and merges results (for "Tất cả").
 */
export const useForumTopicsForCategories = (categoryIds, page = 0, size = 10) => {
  const queries = useQueries({
    queries: (categoryIds ?? []).map((categoryId) => ({
      queryKey: ["forumTopics", { categoryId, page, size }],
      queryFn: fetchForumTopics,
      enabled: !!categoryId,
    })),
  });

  const topics = useMemo(() => {
    const merged = queries.flatMap((q) => (q.data ?? []));
    const byId = new Map(merged.map((t) => [t.id, t]));
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [queries]);

  const isPending = queries.some((q) => q.isPending);
  const isError = queries.some((q) => q.isError);
  const error = queries.find((q) => q.error)?.error;
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải danh sách chủ đề"
      : null;

  return { topics, isPending, isError, errorMessage };
};

