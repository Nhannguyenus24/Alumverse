import { useMutation, useQueryClient } from '@tanstack/react-query';
import { joinMenteeSession, joinMentorSession } from '../../utils/api';

const callJoin = async ({ sessionId, asMentor = false }) => {
  const res = asMentor
    ? await joinMentorSession(sessionId)
    : await joinMenteeSession(sessionId);
  return res?.data?.data ?? null;
};

export const useJoinSession = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: callJoin,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mentorship'] });
      if (data?.meetingLink) {
        window.open(data.meetingLink, '_blank', 'noopener,noreferrer');
      }
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Failed to join session'
      : null;

  return {
    joinSession: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
};
