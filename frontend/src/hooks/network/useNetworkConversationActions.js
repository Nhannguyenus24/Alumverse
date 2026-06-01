import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import { chatApi } from '../../api/chatApi';

export function useNetworkConversationActions(peerMemberId) {
  const { enqueueSnackbar } = useSnackbar();

  const sendMutation = useMutation({
    mutationFn: (body) => chatApi.createConversationRequest(peerMemberId, body),
    onError: (error) => {
      const msg =
        error?.response?.data?.message ?? error?.message ?? 'Không gửi được tin nhắn.';
      enqueueSnackbar(msg, { variant: 'warning' });
    },
  });

  return {
    sendMessage: sendMutation.mutate,
    isSending: sendMutation.isPending,
  };
}
