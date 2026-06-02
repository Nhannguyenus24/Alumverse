import { useQuery } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';

export function useRecentChatPreviews() {
  const query = useQuery({
    queryKey: ['recentChatPreviews'],
    queryFn: () => chatApi.getRecentPreviews(),
  });

  const errorMessage =
    query.isError && query.error
      ? query.error.response?.data?.message ??
        query.error.message ??
        'Không thể tải tin nhắn gần nhất.'
      : null;

  return {
    previews: query.data ?? [],
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    errorMessage,
  };
}
