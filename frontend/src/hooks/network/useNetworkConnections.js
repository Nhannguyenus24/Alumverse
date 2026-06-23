import { useQuery } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';

function buildSearchParams({ appliedFullName, page, pageSize }) {
  const params = {
    page: Math.max(0, page - 1),
    size: pageSize,
  };

  const name = appliedFullName || '';
  if (name) {
    params.fullName = name;
  }

  return params;
}

export function useNetworkConnections({
  appliedFullName,
  page,
  pageSize,
  enabled = true,
}) {
  const params = buildSearchParams({ appliedFullName, page, pageSize });

  const query = useQuery({
    queryKey: [
      'networkConnections',
      params.fullName ?? '',
      params.page,
      params.size,
    ],
    queryFn: () => chatApi.searchConnections(params),
    enabled,
    refetchOnMount: 'always',
  });

  const data = query.data;
  const items = data?.items ?? [];
  const totalPage = data?.totalPage ?? 0;
  const totalItem = data?.totalItem ?? 0;

  const errorMessage =
    query.isError && query.error
      ? query.error.response?.data?.message ??
        query.error.message ??
        'Failed to load connections'
      : null;

  return {
    items,
    totalPage,
    totalItem,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    errorMessage,
    refetch: query.refetch,
  };
}
