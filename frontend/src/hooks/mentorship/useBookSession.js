import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookSession } from '../../utils/api';
import { fileToBase64 } from '../../utils/imageUtils';

/**
 * Single mutation that books a session in one request: the CV file (if any) is sent inline as
 * base64, and the backend stores it and persists the resulting URL.
 *
 * Input: { availabilityId, sessionType, introduction, description, bookingNote, cvFile }
 */
const submitBooking = async ({
  availabilityId,
  sessionType,
  introduction,
  description,
  bookingNote,
  cvFile,
}) => {
  let cvBase64;
  let cvFileName;
  if (cvFile) {
    cvBase64 = await fileToBase64(cvFile);
    cvFileName = cvFile.name;
  }

  const res = await bookSession({
    availabilityId,
    sessionType,
    introduction,
    description,
    bookingNote,
    cvBase64,
    cvFileName,
  });

  return res?.data?.data ?? null;
};

export const useBookSession = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship'] });
    },
  });

  const errorMessage =
    mutation.isError && mutation.error
      ? mutation.error.response?.data?.message ??
        mutation.error.message ??
        'Failed to book session'
      : null;

  return {
    bookSession: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
};
