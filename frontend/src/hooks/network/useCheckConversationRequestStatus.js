import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { chatApi } from '../../utils/api';
import { useNotification } from '../useNotification';

export function useCheckConversationRequestStatus() {
  const { t } = useTranslation('network');
  const { showWarning } = useNotification();
  const mutation = useMutation({
    mutationFn: (targetMemberId) => chatApi.getConversationRequestStatus(targetMemberId),
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Failed to check connection status'
      : null;

  // Warn as soon as the target's status is known — before the drawer's compose box
  // is even touched — instead of only surfacing the block after a failed send.
  const checkStatus = useCallback(
    async (targetMemberId) => {
      const result = await mutation.mutateAsync(targetMemberId);
      if (result?.targetVerified === false) {
        showWarning(t('network:drawer_banner_not_verified'));
      }
      return result;
    },
    [mutation, showWarning, t],
  );

  return {
    checkStatus,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
}
