import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyMenteeProfile, saveMenteeProfile } from '../../utils/api';

const MENTEE_PROFILE_KEY = ['mentorship', 'mentee', 'me', 'profile'];

const fetchProfile = async () => {
  try {
    const res = await getMyMenteeProfile();
    return res?.data?.data ?? null;
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
};

export const useMyMenteeProfile = () =>
  useQuery({
    queryKey: MENTEE_PROFILE_KEY,
    queryFn: fetchProfile,
    retry: false,
    staleTime: 5 * 60_000,
  });

const submit = async (payload) => {
  const res = await saveMenteeProfile(payload);
  return res?.data?.data ?? null;
};

export const useSaveMenteeProfile = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENTEE_PROFILE_KEY });
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Failed to save mentee profile'
      : null;

  return {
    submit: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
};
