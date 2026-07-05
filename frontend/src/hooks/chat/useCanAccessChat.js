import { useCanContribute } from '../useCanContribute';
import { useMyOrganizationMember } from '../useMyOrganizationMember';

/**
 * Whether the current user may access chat at all (open conversations,
 * see previews, send messages) — verificationLevel >= 2, ADMIN/STAFF bypass.
 * Takes the higher of the (possibly stale) authStore level and the live
 * OrganizationMember record, same as useMentorshipAccessState, so a
 * newly-approved member doesn't have to log out/in to unlock chat.
 */
export const useCanAccessChat = () => {
  const { isAuthenticated, isPrivileged, verificationLevel } = useCanContribute();
  const orgMemberQuery = useMyOrganizationMember();
  const liveLevel = Number(orgMemberQuery.data?.verificationLevel ?? 0);
  const level = Math.max(verificationLevel ?? 0, liveLevel);

  return {
    canAccessChat: isPrivileged || level >= 2,
    isAuthenticated,
    isLoading: orgMemberQuery.isLoading,
  };
};
