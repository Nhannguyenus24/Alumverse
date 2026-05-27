import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userSettingsApi } from '../../api/userSettingsApi';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload) => userSettingsApi.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me', 'profile'] });
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Không thể cập nhật hồ sơ'
      : null;

  return {
    updateProfile: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
};
