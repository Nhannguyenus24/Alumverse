import useAuthStore from '../../stores/authStore';
import { useMyMentorProfile } from './useMyMentorProfile';

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
 *   isMentorPending  – profile status DRAFT | PENDING
 *   isMentorApproved – profile status APPROVED
 */
export const useMentorshipAccessState = () => {
  const user = useAuthStore((state) => state.user);
  const verificationLevel = useAuthStore((state) => state.verificationLevel);
  const isLoggedIn = Boolean(user?.id);

  const mentorProfileQuery = useMyMentorProfile();
  const mentorStatus = mentorProfileQuery.data?.status ?? null;
  const mentorMemberId = mentorProfileQuery.data?.memberId ?? null;

  const level = isLoggedIn ? (verificationLevel ?? 0) : -1;

  const isGuest = !isLoggedIn;
  const needsEmailVerification = isLoggedIn && level < 1;
  const needsOrgVerification = isLoggedIn && level === 1;
  const canUseMentorship = isLoggedIn && level >= 2;

  const isMentorPending =
    canUseMentorship &&
    (mentorStatus === 'PENDING' || mentorStatus === 'DRAFT' || mentorStatus === 'NEED_UPDATE');
  const isMentorApproved = canUseMentorship && mentorStatus === 'APPROVED';
  const hasMentorProfile = isMentorPending || isMentorApproved;

  return {
    isLoading: isLoggedIn && mentorProfileQuery.isLoading,
    isGuest,
    needsEmailVerification,
    needsOrgVerification,
    canUseMentorship,
    mentorStatus,
    mentorMemberId,
    isMentorPending,
    isMentorApproved,
    hasMentorProfile,
  };
};
