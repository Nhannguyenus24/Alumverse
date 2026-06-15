import { useQuery } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';

const BACKEND_PAGE_SIZE = 5;

export function useGroupChatList({ searchQuery = '', page = 1 }) {
  const backendPage = Math.max(0, page - 1);

  const query = useQuery({
    queryKey: ['groupChatList', searchQuery, backendPage],
    queryFn: () =>
      chatApi.listGroupChats({ text: searchQuery, page: backendPage, size: BACKEND_PAGE_SIZE }),
    refetchOnMount: 'always',
  });

  const data = query.data;
  const errorMessage =
    query.isError && query.error
      ? query.error.response?.data?.message ??
        query.error.message ??
        'Không thể tải danh sách nhóm chat.'
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
