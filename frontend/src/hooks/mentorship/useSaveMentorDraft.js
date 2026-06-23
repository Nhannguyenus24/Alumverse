import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/axios';
import { saveMentorProfileDraft } from '../../utils/api';
import { fileToBase64 } from '../../utils/imageUtils';

const uploadImageIfPresent = async (file) => {
  if (!file) return null;
  const base64 = await fileToBase64(file);
  const res = await apiClient.post('/images/upload', { base64String: base64 });
  return res?.data?.data ?? null;
};

const submitDraft = async ({
  profile,
  avatarFile,
  coverFile,
  defaultMeetingLink,
  extended,
}) => {
  const [avatarUrl, coverUrl] = await Promise.all([
    uploadImageIfPresent(avatarFile),
    uploadImageIfPresent(coverFile),
  ]);

  const extendedProfile = extended ? JSON.stringify(extended) : undefined;

  const res = await saveMentorProfileDraft({
    ...(profile ?? {}),
    avatarUrl: avatarUrl ?? undefined,
    coverUrl: coverUrl ?? undefined,
    defaultMeetingLink: defaultMeetingLink || undefined,
    extendedProfile,
  });
  return res?.data?.data ?? null;
};

export const useSaveMentorDraft = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitDraft,
    onSuccess: () => {
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
