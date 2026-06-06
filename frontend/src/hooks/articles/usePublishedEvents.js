import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeEvent } from "./normalizeArticle";
import useOrganizationStore from "../../stores/organizationStore";

const fetchEvents = async ({ queryKey }) => {
  const [, scope, { page, limit, organizationId }] = queryKey;
  if (!organizationId) return { items: [], pageInfo: null };
  const path = scope === "past" ? "/events/past" : "/events/upcoming";
  const res = await apiClient.get(path, { params: { page, limit, organizationId } });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedEvents = (scope = "upcoming", page = 0, limit = 10) => {
  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedEvents", scope, { page, limit, organizationId }],
    queryFn: fetchEvents,
    enabled: !!organizationId,
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
