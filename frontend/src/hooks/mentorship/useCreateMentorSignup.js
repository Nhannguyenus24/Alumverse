import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/axios';
import { addMyExpertise, createMentorProfile } from '../../utils/api';
import { fileToBase64 } from '../../utils/imageUtils';

const uploadImageIfPresent = async (file) => {
  if (!file) return null;
  const base64 = await fileToBase64(file);
  const res = await apiClient.post('/images/upload', { base64String: base64 });
  return res?.data?.data ?? null;
};

/**
 * Submits the full mentor signup form:
 *   1. (optional) Upload avatar + cover images
 *   2. POST /mentor/profile  — core profile + image URLs + meeting link
 *   3. POST /mentor/expertise — one row per AI-extracted skill tag (Tab 2),
 *      stored as topic + tag for mentee filtering.
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
  });
  const profileData = profileRes?.data?.data ?? null;

  // Each AI-extracted (or manually-added) tag becomes one expertise row so the
  // existing mentee tag/topic filtering keeps working.
  for (const rawTag of expertiseTags ?? []) {
    const tag = (rawTag ?? '').trim();
    if (!tag) continue;
    await addMyExpertise({
      topic: tag.slice(0, 255),
      yearsExperience: 0,
      tag: tag.slice(0, 100),
    });
  }

  return profileData;
};

export const useCreateMentorSignup = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitMentorSignup,
    onSuccess: () => {
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
