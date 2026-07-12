import { useQuery } from '@tanstack/react-query';
import { userSettingsApi } from '../utils/api';
import useOrganizationStore from '../stores/organizationStore';
import { useAuth } from './useAuth';

/**
 * Member IDs the current user has a peer-verification relationship with (as the
 * requester or the chosen verifier), regardless of status. Used to unlock chat with
 * that specific counterpart before verificationLevel reaches the general contribute
 * threshold — see requestPeerVerification's auto-accepted conversation on the backend.
 */
export const usePeerVerificationCounterparts = () => {
  const { isAuthenticated } = useAuth();
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);

  const query = useQuery({
    queryKey: ['user', 'me', 'peer-verification-counterparts', organizationId],
    queryFn: () => userSettingsApi.getPeerVerificationCounterparts(organizationId),
    enabled: isAuthenticated && Boolean(organizationId),
    staleTime: 60 * 1000,
  });

  return {
    counterparts: query.data ?? [],
    isLoading: query.isLoading,
  };
};
