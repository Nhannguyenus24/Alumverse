import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchEventComments = async ({ queryKey }) => {
  const [, { eventId, page, size }] = queryKey;
  if (!eventId) {
    return { items: [], pageInfo: null };
  }

  const res = await apiClient.get(`/events/${eventId}/comments`, {
    params: { page, size },
  });

  const data = res?.data?.data ?? {};
  const items = data?.items ?? [];

  const pageInfo = {
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

export const useEventComments = (eventId, page = 0, size = 20) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["eventComments", { eventId, page, size }],
    queryFn: fetchEventComments,
    enabled: !!eventId,
  });

  const rawComments = data?.items ?? [];

  const comments = Array.isArray(rawComments)
    ? [...rawComments].sort((a, b) => {
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
      ? error.response?.data?.message ?? error.message ?? "Failed to load comments"
      : null;

  return { comments, pageInfo, isPending, isError, errorMessage };
};
