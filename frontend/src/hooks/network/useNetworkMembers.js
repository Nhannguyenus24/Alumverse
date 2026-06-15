import { useQuery } from '@tanstack/react-query';

import { networkApi } from '../../utils/api';

function buildSearchParams({ appliedFullName, filters, page, pageSize }) {
  const params = {
    page: Math.max(0, page - 1),
    size: pageSize,
  };

  const name = appliedFullName || '';
  if (name) {
    params.fullName = name;
  }

  if (!filters?.all) {
    const program = filters.program || '';
    if (program) {
      params.program = program;
    }

    const major = filters.major || '';
    if (major) {
      params.major = major;
    }
  }

  return params;
}

export function useNetworkMembers({ appliedFullName, filters, page, pageSize, enabled = true }) {
  const params = buildSearchParams({ appliedFullName, filters, page, pageSize });

  const query = useQuery({
    queryKey: [
      'networkMembers',
      params.fullName ?? '',
      params.program ?? '',
      params.major ?? '',
      params.page,
      params.size,
    ],
    queryFn: () => networkApi.searchMembers(params),
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
        'Không thể tải danh sách thành viên.'
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
