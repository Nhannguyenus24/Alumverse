import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from '../../utils/api';

// payload: { qrToken } (scanned/encrypted) or { code } (manual fallback).
export const useCheckInTicket = (eventId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => eventApi.checkInTicket(eventId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventParticipants', eventId] });
    },
  });
};
