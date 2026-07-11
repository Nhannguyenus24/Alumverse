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
  const {
    title,
    content,
    thumbnailBase64,
    topic,
    ...rest
  } = input;
  // The image is sent inline as base64; the backend converts to WebP, stores it, and keeps the
  // existing image when no base64 is provided. No image URL is sent anymore.
  delete rest.thumbnailUrl;
  delete rest.publishedAt;
  delete rest.published_at;
  delete rest.createdAt;
  delete rest.created_at;
  delete rest.awardedDate;
  delete rest.awarded_date;

  switch (channel) {
    case 'achievement':
      return {
        title,
        description: content,
        imageBase64: thumbnailBase64 ?? null,
        topic: topic ?? null,
        ...rest,
      };
    case 'event':
      return {
        title,
        description: content,
        bannerBase64: thumbnailBase64 ?? null,
        topic: topic ?? null,
        ...rest,
      };
    case 'donation':
      return {
        title,
        descriptionFull: content,
        logoBase64: thumbnailBase64 ?? null,
        topic: topic ?? null,
        ...rest,
      };
    case 'job':
      return {
        title,
        description: content,
        type: topic ?? null,
        ...rest,
      };
    case 'learning':
      return {
        title,
        description: content,
        type: topic ?? null,
        thumbnailBase64: thumbnailBase64 ?? null,
        ...rest,
      };
    default:
      return {
        title,
        content,
        thumbnailBase64: thumbnailBase64 ?? null,
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
