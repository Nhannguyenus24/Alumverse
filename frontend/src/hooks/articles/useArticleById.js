import { useQuery } from "@tanstack/react-query";
import apiClient from "../../utils/axios";
import {
  normalizeAchievement,
  normalizeAlumniPost,
  normalizeEvent,
  normalizeFund,
  normalizeJob,
  normalizeLearning,
  normalizeNews,
} from "./normalizeArticle";
import useOrganizationStore from "../../stores/organizationStore";

const CHANNEL_CONFIG = {
  news: {
    url: (id) => `/articles/news/${id}`,
    normalize: normalizeNews,
  },
  alumni: {
    url: (id) => `/articles/alumni-posts/${id}`,
    normalize: normalizeAlumniPost,
  },
  event: {
    url: (id) => `/events/${id}`,
    normalize: normalizeEvent,
  },
  job: {
    url: (id) => `/articles/jobs/${id}`,
    normalize: normalizeJob,
  },
  achievement: {
    url: (id) => `/articles/achievements/${id}`,
    normalize: normalizeAchievement,
  },
  learning: {
    url: (id) => `/articles/learning-resources/${id}`,
    normalize: normalizeLearning,
  },
  donation: {
    url: (id) => `/funds/${id}`,
    normalize: normalizeFund,
  },
};

const fetchArticle = async ({ queryKey }) => {
  const [, { channel, id, organizationId }] = queryKey;
  const config = CHANNEL_CONFIG[channel];
  if (!config) throw new Error(`Unknown article channel: ${channel}`);

  const res = await apiClient.get(config.url(id), { params: { organizationId } });
  const raw = res?.data?.data ?? null;
  return config.normalize(raw);
};

export const useArticleById = (channel, id) => {
  const organizationId = useOrganizationStore((s) => s.organization?.id ?? null);
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["article", { channel, id, organizationId }],
    queryFn: fetchArticle,
    enabled: !!channel && !!id && !!organizationId && !!CHANNEL_CONFIG[channel],
  });

  const errorMessage =
    isError && error
      ? error.response?.data?.message ?? error.message ?? "Failed to load article"
      : null;

  return { article: data, isPending, isError, errorMessage };
};
