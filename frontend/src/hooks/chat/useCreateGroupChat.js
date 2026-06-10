import { useMutation, useQueryClient } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';
import { invalidateChatListQueries } from './invalidateChatQueries';

export function useCreateGroupChat({ onSuccess } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, memberIds }) => chatApi.createGroupChat({ title, memberIds }),
    onSuccess: (createdGroup) => {
      invalidateChatListQueries(queryClient);
      onSuccess?.(createdGroup);
    },
  });
}
