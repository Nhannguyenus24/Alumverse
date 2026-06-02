import { useQuery } from '@tanstack/react-query';

import { chatApi } from '../../api/chatApi';

export function useNetworkIncomingRequests({ appliedFullName, status, page, pageSize }) {
  const apiPage = page - 1; // frontend is 1-based, API is 0-based

  const { data, isLoading, isError } = useQuery({
    queryKey: ['incomingConversationRequests', appliedFullName, status, apiPage, pageSize],
    queryFn: () =>
      chatApi.searchIncomingRequests({
        fullName: appliedFullName || undefined,
        status: status || undefined,
        page: apiPage,
        size: pageSize,
      }),
    keepPreviousData: true,
  });

  return {
    items: data?.items ?? [],
    totalPage: data?.totalPage ?? 0,
    totalCount: data?.totalItem ?? 0,
    isLoading,
    isError,
  };
}
