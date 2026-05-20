import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import {
  acceptConversation,
  declineConversation,
  sendMessage,
} from '../../mocks/networkConversationStore';
import { useNetworkCurrentMemberId } from './useNetworkCurrentMemberId';

export function useNetworkConversationActions(peerMemberId) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const currentMemberId = useNetworkCurrentMemberId();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ['networkConversation', peerMemberId, currentMemberId],
    });
  };

  const sendMutation = useMutation({
    mutationFn: (body) => sendMessage(peerMemberId, currentMemberId, body),
    onSuccess: () => invalidate(),
    onError: (error) => {
      enqueueSnackbar(error?.message ?? 'Không gửi được tin nhắn.', { variant: 'warning' });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: () => acceptConversation(peerMemberId, currentMemberId),
    onSuccess: () => {
      invalidate();
      enqueueSnackbar('Đã chấp nhận. Bạn có thể trò chuyện tự do.', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error?.message ?? 'Không thể chấp nhận.', { variant: 'error' });
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => declineConversation(peerMemberId, currentMemberId),
    onSuccess: () => {
      invalidate();
      enqueueSnackbar('Đã từ chối cuộc trò chuyện.', { variant: 'info' });
    },
    onError: (error) => {
      enqueueSnackbar(error?.message ?? 'Không thể từ chối.', { variant: 'error' });
    },
  });

  return {
    sendMessage: sendMutation.mutate,
    isSending: sendMutation.isPending,
    acceptConversation: acceptMutation.mutate,
    isAccepting: acceptMutation.isPending,
    declineConversation: declineMutation.mutate,
    isDeclining: declineMutation.isPending,
  };
}
