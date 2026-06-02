import { useMutation, useQueryClient } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';

export function useCreateGroupChat({ onSuccess } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, memberIds }) => chatApi.createGroupChat({ title, memberIds }),
    onSuccess: (createdGroup) => {
      queryClient.invalidateQueries({ queryKey: ['groupChatList'] });
      onSuccess?.(createdGroup);
    },
  });
}
