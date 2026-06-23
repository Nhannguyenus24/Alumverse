import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";

const fetchActiveFundReceivingInfos = async () => {
  const res = await apiClient.get("/funds/receiving-infos/active");
  return res?.data?.data ?? [];
};

export const useFundReceivingInfos = () => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["fundReceivingInfos", "active"],
    queryFn: fetchActiveFundReceivingInfos,
    staleTime: 10 * 60 * 1000,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load fund accounts"
      : null;

  return { infos: data ?? [], isPending, isError, errorMessage };
};
