import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMentorProfile } from '../../utils/api';

const submitUpdate = async (payload) => {
  const res = await updateMentorProfile(payload);
  return res?.data?.data ?? null;
};

export const useUpdateMentorProfile = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship'] });
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Failed to update profile'
      : null;

  return {
    updateProfile: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
};
