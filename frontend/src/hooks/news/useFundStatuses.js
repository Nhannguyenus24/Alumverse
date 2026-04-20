import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchFundStatuses = async () => {
  const res = await apiClient.get("/fund-statuses");
  return res?.data?.data ?? [];
};

export const useFundStatuses = () => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["fundStatuses"],
    queryFn: fetchFundStatuses,
    staleTime: 10 * 60 * 1000,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Không thể tải danh sách trạng thái"
      : null;

  return { statuses: data ?? [], isPending, isError, errorMessage };
};
