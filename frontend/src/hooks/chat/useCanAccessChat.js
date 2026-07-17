import { useCanContribute } from '../useCanContribute';
import { useMyOrganizationMember } from '../useMyOrganizationMember';
import { usePeerVerificationCounterparts } from '../usePeerVerificationCounterparts';

/**
 * Whether the current user may access chat at all (open conversations,
 * see previews, send messages) — logged-in users can use chat from level 0.
 * Takes the higher of the (possibly stale) authStore level and the live
 * OrganizationMember record, same as useMentorshipAccessState, so a
 * newly-approved member doesn't have to log out/in to unlock chat.
 *
 * Also unlocked below level 2 for anyone with a peer-verification counterpart
 * (the verifier they requested, or someone who requested them) — that specific
 * conversation is auto-accepted server-side, so the route shouldn't block them
 * from reaching it. General messaging with everyone else still requires level 2.
 */
export const useCanAccessChat = () => {
  const { isAuthenticated, canUseBasicActions } = useCanContribute();
  const orgMemberQuery = useMyOrganizationMember();
  const { counterparts, isLoading: counterpartsLoading } = usePeerVerificationCounterparts();

  return {
    canAccessChat: canUseBasicActions || counterparts.length > 0,
    isAuthenticated,
    isLoading: orgMemberQuery.isLoading || counterpartsLoading,
  };
};
