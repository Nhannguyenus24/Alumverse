import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/axios';
import { addMyExpertise, createMentorProfile } from '../../utils/api';
import { fileToBase64 } from '../images/fileToBase64';

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
 *   3. POST /mentor/expertise — one row per "shareable content" item (Tab 2),
 *      with category + tag stored in dedicated columns.
 */
const submitMentorSignup = async ({
  profile,
  expertises,
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

  for (const item of expertises) {
    await addMyExpertise({
      topic: (item.name ?? '').slice(0, 255),
      yearsExperience: 0,
      description: (item.description ?? '').slice(0, 2000),
      category: item.category ?? 'GENERAL',
      tag: (item.tag ?? '').slice(0, 100) || undefined,
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
        'Không thể tạo hồ sơ cố vấn'
      : null;

  return {
    submit: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
};
