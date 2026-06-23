import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchForumPosts = async ({ queryKey }) => {
  const [, { topicId, page, size, memberId }] = queryKey;
  if (!topicId) {
    return { items: [], pageInfo: null };
  }

  const res = await apiClient.get("/forum/post", {
    params: { topicId, page, size, memberId },
  });

  const data = res?.data?.data ?? {};
  const items = data?.items ?? [];

  // Backend returns pagination metadata at the root of PaginatedResponse,
  // not nested in a pageInfo field.
  const pageInfo = data?.pageInfo ?? {
    currentPage: data?.currentPage ?? 0,
    pageSize: data?.pageSize ?? size,
    totalPage: data?.totalPage ?? 0,
    totalItem: data?.totalItem ?? 0,
    hasNext: Boolean(data?.hasNext),
    hasPrevious: Boolean(data?.hasPrevious),
  };

  return {
    items: Array.isArray(items) ? items : [],
    pageInfo,
  };
};

export const useForumPosts = (topicId, memberId, page = 0, size = 20) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["forumPosts", { topicId, page, size, memberId }],
    queryFn: fetchForumPosts,
    enabled: !!topicId,
  });

  const rawPosts = data?.items ?? [];

  const posts = Array.isArray(rawPosts)
    ? [...rawPosts].sort((a, b) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;

        if (aTime !== bTime) {
          return aTime - bTime;
        }

        const aId = typeof a?.id === "number" ? a.id : 0;
        const bId = typeof b?.id === "number" ? b.id : 0;
        return aId - bId;
      })
    : [];
  const pageInfo = data?.pageInfo ?? null;
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load posts"
      : null;

  return { posts, pageInfo, isPending, isError, errorMessage };
};
