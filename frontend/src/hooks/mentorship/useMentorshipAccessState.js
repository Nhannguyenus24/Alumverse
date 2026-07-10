import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../stores/authStore';
import { useMyMentorProfile } from './useMyMentorProfile';
import { useMyOrganizationMember } from '../useMyOrganizationMember';
import { getMyMenteeProfile } from '../../utils/api';

/**
 * Computes the current user's mentorship access state.
 *
 * Access tiers (internal only, never show raw values to users):
 *   isGuest               – not logged in
 *   needsEmailVerification – logged in, verificationLevel < 1
 *   needsOrgVerification  – logged in, verificationLevel === 1
 *   canUseMentorship      – logged in, verificationLevel >= 2
 *
 * Mentor sub-states (only meaningful when canUseMentorship):
 *   hasMentorProfile     – any mentor profile record exists
 *   isMentorPending      – profile has been submitted and is waiting for review
 *   isMentorApproved     – profile status APPROVED
 *   hasJoinedMentorship  – user can use appointment flows as mentee or approved mentor
 */
export const useMentorshipAccessState = () => {
  const user = useAuthStore((state) => state.user);
  const verificationLevel = useAuthStore((state) => state.verificationLevel);
  const isLoggedIn = Boolean(user?.id);

  const mentorProfileQuery = useMyMentorProfile();
  const mentorStatus = mentorProfileQuery.data?.status ?? null;
  const mentorMemberId = mentorProfileQuery.data?.memberId ?? null;

  // The auth store's verificationLevel is only refreshed at login / token
  // refresh, so it goes stale right after an admin approves verification.
  // Consult the live OrganizationMember record and take the higher level so
  // newly-approved users gain access without having to log out and back in.
  const orgMemberQuery = useMyOrganizationMember();
  const storeLevel = isLoggedIn ? (verificationLevel ?? 0) : 0;
  const liveMemberLevel = Number(orgMemberQuery.data?.verificationLevel ?? 0);
  const level = isLoggedIn ? Math.max(storeLevel, liveMemberLevel) : -1;

  const isGuest = !isLoggedIn;
  const needsEmailVerification = isLoggedIn && level < 1;
  const needsOrgVerification = isLoggedIn && level === 1;
  const canUseMentorship = isLoggedIn && level >= 2;

  // Only fetch the mentee profile once the user can actually use mentorship,
  // to avoid 401/403 noise for guests and unverified members.
  // IMPORTANT: this query shares its key with useMyMenteeProfile(). The options
  // (queryFn, retry, staleTime, 404 handling) MUST stay identical, otherwise two
  // observers on the same key with mismatched staleTime trigger an endless
  // refetch storm (observed as repeated 429s on /mentorship/mentee/profile).
  const menteeProfileQuery = useQuery({
    queryKey: ['mentorship', 'mentee', 'me', 'profile'],
    queryFn: async () => {
      try {
        const res = await getMyMenteeProfile();
        return res?.data?.data ?? null;
      } catch (err) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
    enabled: canUseMentorship,
  });
  const hasMenteeProfile = Boolean(menteeProfileQuery.data?.memberId);

  const hasMentorProfile = canUseMentorship && Boolean(mentorStatus);
  const isMentorDraft = canUseMentorship && mentorStatus === 'DRAFT';
  const isMentorPending = canUseMentorship && mentorStatus === 'PENDING';
  const isMentorRejected = canUseMentorship && mentorStatus === 'REJECTED';
  const isMentorNeedUpdate = canUseMentorship && mentorStatus === 'NEED_UPDATE';
  const isMentorActionable = isMentorDraft || isMentorRejected || isMentorNeedUpdate;
  const isMentorApproved = canUseMentorship && mentorStatus === 'APPROVED';

  // "Joined mentorship" = can participate in booking flows now.
  // A submitted-but-pending mentor profile still needs admin approval first.
  const hasJoinedMentorship = canUseMentorship && !isMentorPending && (hasMenteeProfile || isMentorApproved);

  const canPreviewMentors = isLoggedIn && level >= 1;

  const isLoading =
    (isLoggedIn && mentorProfileQuery.isLoading) ||
    (isLoggedIn && orgMemberQuery.isLoading) ||
    (canUseMentorship && menteeProfileQuery.isLoading);

  return {
    isLoading,
    isGuest,
    needsEmailVerification,
    needsOrgVerification,
    canUseMentorship,
    canPreviewMentors,
    mentorStatus,
    mentorMemberId,
    isMentorDraft,
    isMentorPending,
    isMentorRejected,
    isMentorNeedUpdate,
    isMentorActionable,
    isMentorApproved,
    hasMentorProfile,
    hasMenteeProfile,
    hasJoinedMentorship,
  };
};
