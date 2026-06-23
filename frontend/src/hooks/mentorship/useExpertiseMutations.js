import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addMyExpertise,
  deleteMyExpertise,
  updateMyExpertise,
} from '../../utils/api';

const EXPERTISE_KEY = ['mentorship', 'mentor', 'me', 'expertise'];

const extractError = (mutation, fallback) =>
  mutation.isError && mutation.error
    ? mutation.error.response?.data?.message ?? mutation.error.message ?? fallback
    : null;

export const useAddExpertise = () => {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await addMyExpertise(payload);
      return res?.data?.data ?? null;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPERTISE_KEY }),
  });
  return {
    submit: mutation.mutateAsync,
    isPending: mutation.isPending,
    errorMessage: extractError(mutation, 'Failed to add expertise'),
  };
};

export const useUpdateExpertise = () => {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await updateMyExpertise(id, payload);
      return res?.data?.data ?? null;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPERTISE_KEY }),
  });
  return {
    submit: mutation.mutateAsync,
    isPending: mutation.isPending,
    errorMessage: extractError(mutation, 'Failed to update expertise'),
  };
};

export const useDeleteExpertise = () => {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id) => {
      await deleteMyExpertise(id);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPERTISE_KEY }),
  });
  return {
    submit: mutation.mutateAsync,
    isPending: mutation.isPending,
    errorMessage: extractError(mutation, 'Failed to delete expertise'),
  };
};
