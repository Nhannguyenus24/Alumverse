import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/axios';
import { createMentorProfile } from '../../utils/api';
import { fileToBase64 } from '../../utils/imageUtils';
import useAuthStore from '../../stores/authStore';

const toBase64IfPresent = async (image) => {
  if (!image) return null;
  return typeof image === 'string' && image.startsWith('data:')
    ? image
    : await fileToBase64(image);
};

/**
 * Submits the full mentor signup form in a single round-trip per resource:
 *   1. POST /mentor/profile — core profile + avatar (as base64; the backend converts to
 *      WebP and stores it) + meeting link + expertiseTags (priority-ordered, from CV +
 *      description extraction, confirmed at the review step). The backend normalizes these
 *      into the skills catalog (mentor_skills) used by the mentee "filter by skill".
 *   2. (optional) PUT /users/me/cover with the cover as base64.
 */
const submitMentorSignup = async ({
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

  const profileRes = await createMentorProfile({
    ...profile,
    avatarBase64: avatarBase64 ?? undefined,
    defaultMeetingLink: defaultMeetingLink || undefined,
    extendedProfile,
    expertiseTags: (expertiseTags ?? []).map((tag) => (tag ?? '').trim()).filter(Boolean),
  });
  if (coverBase64) {
    await apiClient.put('/users/me/cover', { coverBase64 });
  }
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
