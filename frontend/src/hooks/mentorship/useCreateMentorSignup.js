import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/axios';
import { createMentorProfile } from '../../utils/api';
import { fileToBase64 } from '../../utils/imageUtils';
import useAuthStore from '../../stores/authStore';

const uploadImageIfPresent = async (image) => {
  if (!image) return null;
  const base64 = typeof image === 'string' && image.startsWith('data:')
    ? image
    : await fileToBase64(image);
  const res = await apiClient.post('/images/upload', { base64String: base64 });
  return res?.data?.data ?? null;
};

/**
 * Submits the full mentor signup form:
 *   1. (optional) Upload avatar + cover images
 *   2. POST /mentor/profile — core profile + image URLs + meeting link +
 *      expertiseTags (priority-ordered, from CV + description extraction,
 *      confirmed at the review step). The backend normalizes these into the
 *      skills catalog (mentor_skills) used by the mentee "filter by skill".
 */
const submitMentorSignup = async ({
  profile,
  expertiseTags,
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

  const profileRes = await createMentorProfile({
    ...profile,
    avatarUrl: avatarUrl ?? undefined,
    coverUrl: coverUrl ?? undefined,
    defaultMeetingLink: defaultMeetingLink || undefined,
    extendedProfile,
    expertiseTags: (expertiseTags ?? []).map((tag) => (tag ?? '').trim()).filter(Boolean),
  });
  return profileRes?.data?.data ?? null;
};

export const useCreateMentorSignup = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitMentorSignup,
    onSuccess: (data) => {
      if (data?.avatarUrl) {
        useAuthStore.getState().setUser({
          ...useAuthStore.getState().user,
          avatarUrl: data.avatarUrl,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['user', 'me', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['publicProfile'] });
      queryClient.invalidateQueries({ queryKey: ['mentorship'] });
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Failed to create mentor profile'
      : null;

  return {
    submit: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
};
