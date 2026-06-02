import { useMutation, useQueryClient } from '@tanstack/react-query';

import { chatApi } from '../../api/chatApi';

export function useRespondConversationRequest({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, status }) =>
      chatApi.respondToConversationRequest(requestId, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incomingConversationRequests'] });
      onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      onError?.(error, variables);
    },
  });
}
