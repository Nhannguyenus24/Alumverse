import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import { normalizeJob } from "./normalizeArticle";
import useOrganizationStore from "../../stores/organizationStore";

const fetchActiveJobs = async ({ queryKey }) => {
  const [, { page, limit, organizationId }] = queryKey;
  if (!organizationId) return { items: [], pageInfo: null };
  const res = await apiClient.get("/articles/jobs/active", {
    params: { page, limit, organizationId },
  });
  return res?.data?.data ?? { items: [], pageInfo: null };
};

export const usePublishedJobs = (page = 0, limit = 10) => {
  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["publishedJobs", { page, limit, organizationId }],
    queryFn: fetchActiveJobs,
    enabled: !!organizationId,
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
