import { useQuery } from '@tanstack/react-query';
import { eventApi } from '../../utils/api';

export const useEventParticipants = (eventId, { status, keyword, page = 0, size = 10, enabled = true } = {}) => {
  return useQuery({
    queryKey: ['eventParticipants', eventId, status, keyword, page, size],
    queryFn: () => eventApi.getTicketsByEvent(eventId, {
      status,
      keyword: keyword || undefined,
      page,
      limit: size,
    }),
    enabled: Boolean(eventId) && enabled,
  });
};
