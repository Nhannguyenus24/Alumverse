import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeJob } from "./normalizeArticle";

const fetchActiveJobs = async ({ queryKey }) => {
  const [, { page, limit }] = queryKey;
  const res = await apiClient.get("/articles/jobs/active", {
    params: { page, limit },
  });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedJobs = (page = 0, limit = 10) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedJobs", { page, limit }],
    queryFn: fetchActiveJobs,
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load jobs"
      : null;

  return {
    jobs: (data?.items ?? []).map(normalizeJob),
    pageInfo: data?.pageInfo ?? null,
    isPending,
    isError,
    errorMessage,
  };
};
