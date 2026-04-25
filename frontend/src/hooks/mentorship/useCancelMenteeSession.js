import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelSession } from '../../api/mentorshipApi';

const callCancel = async (sessionId) => {
  const res = await cancelSession(sessionId);
  return res?.data?.data ?? null;
};

export const useCancelMenteeSession = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: callCancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship'] });
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Không thể hủy lịch hẹn'
      : null;

  return {
    cancelSession: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
};
