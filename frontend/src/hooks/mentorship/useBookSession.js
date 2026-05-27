import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookSession, uploadCvFile } from '../../api/mentorshipApi';
import { fileToBase64 } from '../images/fileToBase64';

/**
 * Single mutation that handles:
 *   1. (optional) Upload CV file → returns URL
 *   2. POST /mentee/sessions/book with the resolved cvUrl
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
  let cvUrl = null;
  if (cvFile) {
    const base64String = await fileToBase64(cvFile);
    const uploadRes = await uploadCvFile({ base64String, fileName: cvFile.name });
    cvUrl = uploadRes?.data?.data ?? null;
  }

  const res = await bookSession({
    availabilityId,
    sessionType,
    introduction,
    description,
    bookingNote,
    cvUrl,
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
        'Không thể đặt lịch hẹn'
      : null;

  return {
    bookSession: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage,
  };
};
