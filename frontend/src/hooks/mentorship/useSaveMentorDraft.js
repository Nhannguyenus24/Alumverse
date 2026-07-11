import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/axios';
import { saveMentorProfileDraft } from '../../utils/api';
import { fileToBase64 } from '../../utils/imageUtils';
import useAuthStore from '../../stores/authStore';

const toBase64IfPresent = async (image) => {
  if (!image) return null;
  return typeof image === 'string' && image.startsWith('data:')
    ? image
    : await fileToBase64(image);
};

const submitDraft = async ({
  profile,
  expertiseTags,
  avatarFile,
  coverFile,
  defaultMeetingLink,
  extended,
}) => {
  const [avatarBase64, coverBase64] = await Promise.all([
    toBase64IfPresent(avatarFile),
    toBase64IfPresent(coverFile),
  ]);

  const extendedProfile = extended ? JSON.stringify(extended) : undefined;

  const res = await saveMentorProfileDraft({
    ...(profile ?? {}),
    avatarBase64: avatarBase64 ?? undefined,
    defaultMeetingLink: defaultMeetingLink || undefined,
    extendedProfile,
    expertiseTags: (expertiseTags ?? []).map((tag) => (tag ?? '').trim()).filter(Boolean),
  });
  if (coverBase64) {
    await apiClient.put('/users/me/cover', { coverBase64 });
  }
  return res?.data?.data ?? null;
};

export const useSaveMentorDraft = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitDraft,
    onSuccess: (data) => {
      if (data?.avatarUrl) {
        useAuthStore.getState().setUser({
          ...useAuthStore.getState().user,
          avatarUrl: data.avatarUrl,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['user', 'me', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['publicProfile'] });
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'mentor', 'me', 'profile'] });
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Failed to save profile draft'
      : null;

  return {
    submit: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
};
