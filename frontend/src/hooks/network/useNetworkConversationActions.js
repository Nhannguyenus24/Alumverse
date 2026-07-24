import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import { chatApi } from '../../utils/api';

export function useNetworkConversationActions(peerMemberId) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const sendMutation = useMutation({
    mutationFn: (body) => chatApi.createConversationRequest(peerMemberId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomingConversationRequests'] });
      queryClient.invalidateQueries({ queryKey: ['networkMembers'] });
      // Replying to an incoming request auto-accepts it, creating a new connection and
      // private chat, so refresh those lists too.
      queryClient.invalidateQueries({ queryKey: ['networkConnections'] });
      queryClient.invalidateQueries({ queryKey: ['privateChatList'] });
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message ?? error?.message ?? 'Failed to send message';
      enqueueSnackbar(msg, { variant: 'warning' });
    },
  });

  return {
    sendMessage: sendMutation.mutate,
    isSending: sendMutation.isPending,
  };
}
