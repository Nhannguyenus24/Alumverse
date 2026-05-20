import { useQuery } from '@tanstack/react-query';

import { getConversation } from '../../mocks/networkConversationStore';
import { useNetworkCurrentMemberId } from './useNetworkCurrentMemberId';

export function useNetworkConversation(peerMemberId, enabled = true) {
  const currentMemberId = useNetworkCurrentMemberId();

  const query = useQuery({
    queryKey: ['networkConversation', peerMemberId, currentMemberId],
    queryFn: () => {
      if (peerMemberId == null) return null;
      return getConversation(peerMemberId, currentMemberId);
    },
    enabled: enabled && peerMemberId != null,
  });

  return {
    conversation: query.data ?? null,
    currentMemberId,
    isPending: query.isPending,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
