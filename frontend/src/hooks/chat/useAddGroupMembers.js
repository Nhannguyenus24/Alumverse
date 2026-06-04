import { useMutation, useQueryClient } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';

export function useAddGroupMembers({ groupId, onSuccess } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberIds) => chatApi.addMembersToGroup(groupId, memberIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'group-members', groupId] });
      onSuccess?.();
    },
  });
}
