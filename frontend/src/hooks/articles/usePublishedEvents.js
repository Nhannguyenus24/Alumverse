import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeEvent } from "./normalizeArticle";

const fetchEvents = async ({ queryKey }) => {
  const [, scope, { page, limit }] = queryKey;
  const path = scope === "past" ? "/events/past" : "/events/upcoming";
  const res = await apiClient.get(path, { params: { page, limit } });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedEvents = (scope = "upcoming", page = 0, limit = 10) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedEvents", scope, { page, limit }],
    queryFn: fetchEvents,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải danh sách sự kiện"
      : null;

  return {
    events: (data?.items ?? []).map(normalizeEvent),
    pageInfo: data?.pageInfo ?? null,
    isPending,
    isError,
    errorMessage,
  };
};
