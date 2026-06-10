import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import { chatApi } from '../../utils/api';

export function useBlockStatus(targetMemberId) {
  return useQuery({
    queryKey: ['chat', 'block-status', targetMemberId],
    queryFn: () => chatApi.getBlockStatus(targetMemberId),
    enabled: targetMemberId != null,
  });
}

export function useBlockUser({ targetMemberId, onSuccess } = {}) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['chat', 'block-status', targetMemberId] });
    queryClient.invalidateQueries({ queryKey: ['chat', 'blocks'] });
    queryClient.invalidateQueries({ queryKey: ['networkMembers'] });
    queryClient.invalidateQueries({ queryKey: ['networkConnections'] });
    queryClient.invalidateQueries({ queryKey: ['blockedMembers'] });
    queryClient.invalidateQueries({ queryKey: ['privateChatList'] });
    queryClient.invalidateQueries({ queryKey: ['recentChatPreviews'] });
  };

  const blockMutation = useMutation({
    mutationFn: () => chatApi.blockUser(targetMemberId),
    onSuccess: () => {
      invalidate();
      enqueueSnackbar('Đã chặn người dùng.', { variant: 'success' });
      onSuccess?.();
    },
    onError: (error) => {
      const message = error?.response?.data?.message ?? 'Không thể chặn người dùng.';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => chatApi.unblockUser(targetMemberId),
    onSuccess: () => {
      invalidate();
      enqueueSnackbar('Đã bỏ chặn người dùng.', { variant: 'success' });
      onSuccess?.();
    },
    onError: (error) => {
      const message = error?.response?.data?.message ?? 'Không thể bỏ chặn người dùng.';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  return {
    blockUser: blockMutation.mutate,
    unblockUser: unblockMutation.mutate,
    isBlocking: blockMutation.isPending,
    isUnblocking: unblockMutation.isPending,
    isPending: blockMutation.isPending || unblockMutation.isPending,
  };
}
