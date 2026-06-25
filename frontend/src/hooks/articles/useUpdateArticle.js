import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/axios';

const ENDPOINT_BY_CHANNEL = {
  news: (id) => `/articles/news/${id}`,
  alumni: (id) => `/articles/alumni-posts/${id}`,
  achievement: (id) => `/articles/achievements/${id}`,
  job: (id) => `/articles/jobs/${id}`,
  learning: (id) => `/articles/learning-resources/${id}`,
  event: (id) => `/events/${id}`,
  donation: (id) => `/funds/${id}`,
};

const buildPayload = (channel, input) => {
  const { title, content, thumbnailBase64, thumbnailUrl, topic, ...rest } = input;
  switch (channel) {
    case 'achievement':
      return {
        title,
        description: content,
        imageBase64: thumbnailBase64 ?? null,
        imageUrl: thumbnailUrl ?? null,
        topic: topic ?? null,
        ...rest,
      };
    case 'event':
      return {
        title,
        description: content,
        bannerBase64: thumbnailBase64 ?? null,
        bannerUrl: thumbnailUrl ?? null,
        topic: topic ?? null,
        ...rest,
      };
    case 'donation':
      return {
        title,
        descriptionFull: content,
        logoBase64: thumbnailBase64 ?? null,
        logoUrl: thumbnailUrl ?? null,
        topic: topic ?? null,
        ...rest,
      };
    case 'job':
    case 'learning':
      return {
        title,
        description: content,
        type: topic ?? null,
        ...rest,
      };
    default:
      return {
        title,
        content,
        thumbnailBase64: thumbnailBase64 ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
        topic: topic ?? null,
        ...rest,
      };
  }
};

export const useUpdateArticle = (channel) => {
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const updateArticle = async (id, input) => {
    const buildUrl = ENDPOINT_BY_CHANNEL[channel];
    if (!buildUrl) {
      throw new Error(`Unknown article channel: ${channel}`);
    }
    setIsPending(true);
    try {
      const payload = buildPayload(channel, input);
      const res = await apiClient.put(buildUrl(id), payload);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['article'] }),
        queryClient.invalidateQueries({ queryKey: ['news'] }),
        queryClient.invalidateQueries({ queryKey: ['publishedNews'] }),
        queryClient.invalidateQueries({ queryKey: ['publishedAlumniPosts'] }),
        queryClient.invalidateQueries({ queryKey: ['publishedAchievements'] }),
        queryClient.invalidateQueries({ queryKey: ['publishedJobs'] }),
        queryClient.invalidateQueries({ queryKey: ['publishedLearning'] }),
        queryClient.invalidateQueries({ queryKey: ['publishedEvents'] }),
        queryClient.invalidateQueries({ queryKey: ['publishedFunds'] }),
      ]);

      return res?.data?.data ?? null;
    } finally {
      setIsPending(false);
    }
  };

  return { updateArticle, isPending };
};
