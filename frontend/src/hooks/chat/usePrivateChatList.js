import { useQuery } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';

const DEFAULT_PAGE_SIZE = 5;

export function usePrivateChatList({ searchQuery = '', page = 1, pageSize = DEFAULT_PAGE_SIZE }) {
  const backendPage = Math.max(0, page - 1);

  const query = useQuery({
    queryKey: ['privateChatList', searchQuery, backendPage, pageSize],
    queryFn: () =>
      chatApi.listPrivateChats({ text: searchQuery, page: backendPage, size: pageSize }),
    refetchOnMount: 'always',
  });

  const data = query.data;
  const errorMessage =
    query.isError && query.error
      ? query.error.response?.data?.message ??
        query.error.message ??
        'Không thể tải danh sách chat cá nhân.'
      : null;

  return {
    items: data?.items ?? [],
    totalPage: data?.totalPage ?? 0,
    totalItem: data?.totalItem ?? 0,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    errorMessage,
  };
}
