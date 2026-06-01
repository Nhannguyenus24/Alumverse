import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMyAvailability } from '../../utils/api';

const callDelete = async (id) => {
  const res = await deleteMyAvailability(id);
  return res?.data?.data ?? null;
};

export const useDeleteAvailability = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: callDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship'] });
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Không thể xóa lịch'
      : null;

  return {
    deleteAvailability: mutation.mutateAsync,
    isPending: mutation.isPending,
    errorMessage,
  };
};
