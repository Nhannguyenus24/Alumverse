import { keepPreviousData, useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const EMPTY_PAGE = {
  items: [],
  currentPage: 0,
  pageSize: 0,
  totalPage: 0,
  totalItem: 0,
  hasNext: false,
  hasPrevious: false,
};

const fetchForumTopics = async ({ queryKey }) => {
  const [, { categoryId, keyword, sortBy, page, size }] = queryKey;
  if (!categoryId) {
    return EMPTY_PAGE;
  }

  const res = await apiClient.get("/forum/topic", {
    params: { categoryId, keyword, sortBy, page, size },
  });

  const data = res?.data?.data ?? {};
  return {
    ...EMPTY_PAGE,
    ...data,
    items: Array.isArray(data.items) ? data.items : [],
  };
};

export const useForumTopics = (categoryId, keyword = '', sortBy = '', page = 0, size = 20) => {
  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["forumTopics", { categoryId, keyword, sortBy, page, size }],
    queryFn: fetchForumTopics,
    enabled: !!categoryId,
    placeholderData: keepPreviousData,
  });

  const pageInfo = data ?? EMPTY_PAGE;
  const topics = pageInfo.items ?? [];
  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load topics"
      : null;

  return { topics, pageInfo, isPending, isError, errorMessage };
};
