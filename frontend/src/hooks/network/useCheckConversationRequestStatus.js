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

  return {
    checkStatus: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
}
