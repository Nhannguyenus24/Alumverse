import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchFunds = async ({ queryKey }) => {
  const [, { page, limit }] = queryKey;
  const res = await apiClient.get("/funds", { params: { page, limit } });
  // FundController wraps result in DataWithWarnings -> { data: PaginatedResponse, warnings }
  const payload = res?.data?.data ?? null;
  return payload?.data ?? payload ?? { items: [], pageInfo: null };
};

const normalizeFundListItem = (item) => ({
  id: item?.id,
  channel: "donation",
  title: item?.name,
  content: item?.descriptionShort,
  thumbnailUrl: item?.logoUrl,
  publishedAt: item?.timeStarted,
  targetAmount: item?.targetAmount,
  currentAmount: item?.currentAmount,
  donorCount: item?.donorCount,
  timeStarted: item?.timeStarted,
  timeEnded: item?.timeEnded,
});

export const usePublishedFunds = (page = 0, limit = 10) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedFunds", { page, limit }],
    queryFn: fetchFunds,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải danh sách quỹ quyên góp"
      : null;

  return {
    funds: (data?.items ?? []).map(normalizeFundListItem),
    pageInfo: data?.pageInfo ?? null,
    isPending,
    isError,
    errorMessage,
  };
};
