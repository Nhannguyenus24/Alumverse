import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../stores/authStore';
import { useMyMentorProfile } from './useMyMentorProfile';
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

  // Only fetch the mentee profile once the user can actually use mentorship,
  // to avoid 401/403 noise for guests and unverified members.
  const menteeProfileQuery = useQuery({
    queryKey: ['mentorship', 'mentee', 'me', 'profile'],
    queryFn: async () => {
      const res = await getMyMenteeProfile();
      return res?.data?.data ?? null;
    },
    retry: false,
    enabled: canUseMentorship,
  });
  const hasMenteeProfile = Boolean(menteeProfileQuery.data?.memberId);

  const isMentorPending =
    canUseMentorship &&
    (mentorStatus === 'PENDING' || mentorStatus === 'DRAFT' || mentorStatus === 'NEED_UPDATE');
  const isMentorApproved = canUseMentorship && mentorStatus === 'APPROVED';
  const hasMentorProfile = isMentorPending || isMentorApproved;

  // "Joined mentorship" = has completed a mentee or mentor sign-up.
  const hasJoinedMentorship = canUseMentorship && (hasMenteeProfile || hasMentorProfile);

  const canPreviewMentors = isLoggedIn && level >= 1;

  const isLoading =
    (isLoggedIn && mentorProfileQuery.isLoading) ||
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
    isMentorPending,
    isMentorApproved,
    hasMentorProfile,
    hasMenteeProfile,
    hasJoinedMentorship,
  };
};
