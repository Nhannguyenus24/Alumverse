import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addMyAvailability } from '../../utils/api';

const callAdd = async ({ startTime, endTime }) => {
  const res = await addMyAvailability({ startTime, endTime });
  return res?.data?.data ?? null;
};

export const useAddAvailability = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: callAdd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship'] });
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Failed to add availability'
      : null;

  return {
    addAvailability: mutation.mutateAsync,
    isPending: mutation.isPending,
    errorMessage,
  };
};
