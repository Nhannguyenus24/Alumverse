import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import { chatApi } from '../../utils/api';
import { invalidateGroupBlockedMembersQueries } from '../chat/invalidateChatQueries';

function useBlockStatus(targetMemberId) {
  return useQuery({
    queryKey: ['chat', 'block-status', targetMemberId],
    queryFn: () => chatApi.getBlockStatus(targetMemberId),
    enabled: targetMemberId != null,
  });
}

export function useBlockUser({ targetMemberId, onSuccess } = {}) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation('network');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['chat', 'block-status', targetMemberId] });
    queryClient.invalidateQueries({ queryKey: ['chat', 'blocks'] });
    queryClient.invalidateQueries({ queryKey: ['networkMembers'] });
    queryClient.invalidateQueries({ queryKey: ['networkConnections'] });
    queryClient.invalidateQueries({ queryKey: ['blockedMembers'] });
    queryClient.invalidateQueries({ queryKey: ['privateChatList'] });
    queryClient.invalidateQueries({ queryKey: ['recentChatPreviews'] });
    invalidateGroupBlockedMembersQueries(queryClient);
  };

  const blockMutation = useMutation({
    mutationFn: () => chatApi.blockUser(targetMemberId),
    onSuccess: () => {
      invalidate();
      enqueueSnackbar(t('network:block_success'), { variant: 'success' });
      onSuccess?.();
    },
    onError: (error) => {
      const message = error?.response?.data?.message ?? t('network:block_failed');
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => chatApi.unblockUser(targetMemberId),
    onSuccess: () => {
      invalidate();
      enqueueSnackbar(t('network:unblock_success'), { variant: 'success' });
      onSuccess?.();
    },
    onError: (error) => {
      const message = error?.response?.data?.message ?? t('network:unblock_failed');
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
