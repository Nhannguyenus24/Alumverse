import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';

function normalizeRecentChatPreview(item) {
  return {
    id: item.id,
    name: item.name ?? '(No name)',
    avatarUrl: item.avatarUrl ?? null,
    preview: item.preview ?? '',
    updatedAt: item.updatedAt ?? null,
    type: item.type === 'GROUP' ? 'GROUP' : 'PRIVATE',
  };
}

export function useRecentChatPreviews({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: ['recentChatPreviews'],
    queryFn: () => chatApi.getRecentPreviews(),
    enabled,
    refetchOnMount: 'always',
  });

  const previews = useMemo(
    () => (query.data ?? []).map(normalizeRecentChatPreview),
    [query.data],
  );

  const errorMessage =
    query.isError && query.error
      ? query.error.response?.data?.message ??
        query.error.message ??
        'Không thể tải tin nhắn gần nhất.'
      : null;

  return {
    previews,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    errorMessage,
  };
}
