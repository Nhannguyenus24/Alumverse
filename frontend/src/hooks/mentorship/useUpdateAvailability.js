import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyAvailability } from '../../utils/api';

const callUpdate = async ({ id, startTime, endTime }) => {
  const res = await updateMyAvailability(id, { startTime, endTime });
  return res?.data?.data ?? null;
};

export const useUpdateAvailability = () => {
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
        'Không thể cập nhật slot'
      : null;

  return {
    updateAvailability: mutation.mutateAsync,
    isPending: mutation.isPending,
    errorMessage,
  };
};
