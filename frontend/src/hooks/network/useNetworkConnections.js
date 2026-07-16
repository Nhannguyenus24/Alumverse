import { useQuery } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';
import useAuthStore from '../../stores/authStore';
import { useOrganization } from '../useOrganization';

function buildSearchParams({ appliedFullName, page, pageSize, organizationId }) {
  const params = {
    page: Math.max(0, page - 1),
    size: pageSize,
  };

  const name = appliedFullName || '';
  if (name) {
    params.fullName = name;
  }

  if (organizationId != null) {
    params.organizationId = organizationId;
  }

  return params;
}

export function useNetworkConnections({
  appliedFullName,
  page,
  pageSize,
  enabled = true,
}) {
  // ADMIN's JWT carries no organizationId ("all orgs") — the backend falls back to this
  // param for them only; USER/STAFF ignore it since their JWT already has one.
  const role = useAuthStore((state) => state.user?.role);
  const { organization } = useOrganization();
  const organizationId = role === 'ADMIN' ? organization?.id ?? null : null;

  const params = buildSearchParams({ appliedFullName, page, pageSize, organizationId });

  const query = useQuery({
    queryKey: [
      'networkConnections',
      params.fullName ?? '',
      params.page,
      params.size,
      params.organizationId ?? '',
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
