import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSessionStatus } from '../../api/mentorshipApi';

const callUpdate = async ({ sessionId, status, meetingLink }) => {
  const res = await updateSessionStatus(sessionId, { status, meetingLink });
  return res?.data?.data ?? null;
};

export const useUpdateSessionStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: callUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship'] });
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Không thể cập nhật trạng thái'
      : null;

  return {
    updateStatus: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
};
