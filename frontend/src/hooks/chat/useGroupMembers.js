import { useQuery } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';

export function useGroupMembers(groupId, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: ['chat', 'group-members', groupId],
    queryFn: () => chatApi.getGroupMembers(groupId),
    enabled: Boolean(groupId) && enabled,
  });

  const data = query.data;
  const errorMessage =
    query.isError && query.error
      ? query.error.response?.data?.message ??
        query.error.message ??
        'Không thể tải danh sách thành viên.'
      : null;

  return {
    members: data?.items ?? [],
    totalItem: data?.totalItem ?? 0,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    errorMessage,
  };
}
