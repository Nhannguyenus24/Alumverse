import { useQuery } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';

export function useNetworkIncomingRequests({ appliedFullName, status, page, pageSize }) {
  const apiPage = Math.max(page - 1, 0); // frontend is 1-based, API is 0-based

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
    refetchOnMount: 'always',
  });

  return {
    items: data?.items ?? [],
    totalPage: data?.totalPage ?? 0,
    totalCount: data?.totalItem ?? 0,
    isLoading,
    isError,
  };
}
