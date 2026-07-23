import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';

export function useCheckConversationRequestStatus() {
  const mutation = useMutation({
    mutationFn: (targetMemberId) => chatApi.getConversationRequestStatus(targetMemberId),
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Failed to check connection status'
      : null;

  const checkStatus = useCallback(
    (targetMemberId) => mutation.mutateAsync(targetMemberId),
    [mutation],
  );

  return {
    checkStatus,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
}
