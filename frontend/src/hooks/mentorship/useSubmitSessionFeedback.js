import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSessionFeedback } from '../../utils/api';

export const useSubmitSessionFeedback = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ sessionId, rating, comment, isPublic = true }) => {
      const res = await createSessionFeedback(sessionId, { rating, comment, isPublic });
      return res?.data?.data ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship'] });
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Failed to submit feedback'
      : null;

  return {
    submitFeedback: mutation.mutateAsync,
    isPending: mutation.isPending,
    errorMessage,
  };
};
