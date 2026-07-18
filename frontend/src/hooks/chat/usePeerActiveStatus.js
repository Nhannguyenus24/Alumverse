import { useQuery } from '@tanstack/react-query';

import { chatApi } from '../../utils/api';

export function usePeerActiveStatus(peerMemberId, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: ['chat', 'peer-active-status', peerMemberId],
    queryFn: () => chatApi.getPeerActiveStatus(peerMemberId),
    enabled: Boolean(peerMemberId) && enabled,
  });

  return {
    // Defaults to active while loading/on error so the composer isn't
    // disabled for a transient network hiccup.
    peerActive: query.data?.active ?? true,
    isPending: query.isPending,
    isError: query.isError,
  };
}
