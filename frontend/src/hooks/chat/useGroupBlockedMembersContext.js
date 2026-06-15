import { useQuery } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';

export function useGroupBlockedMembersContext(groupId, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: ['chat', 'group-blocked-members', groupId],
    queryFn: () => chatApi.getGroupBlockedMembersContext(groupId),
    enabled: Boolean(groupId) && enabled,
  });

  const data = query.data;
  const blockedMembers = data?.blockedMembers ?? [];
  const currentUserRole = data?.currentUserRole ?? null;
  const isOwner = currentUserRole === 'OWNER';

  return {
    blockedMembers,
    currentUserRole,
    isOwner,
    hasBlockedMembersInGroup: blockedMembers.length > 0,
    isPending: query.isPending,
    isError: query.isError,
  };
}
