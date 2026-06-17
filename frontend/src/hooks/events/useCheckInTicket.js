import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from '../../utils/api';

export const useCheckInTicket = (eventId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketCode) => eventApi.checkInTicket(ticketCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventParticipants', eventId] });
    },
  });
};
