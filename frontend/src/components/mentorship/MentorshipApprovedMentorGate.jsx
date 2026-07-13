import LoadingSkeleton from '../LoadingSkeleton';
import { useEffect } from 'react';
import { Box } from '@mui/material';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { MENTORSHIP_LANDING } from '../../constants/mentorshipNav';

const MentorshipApprovedMentorGate = ({ children }) => {
  const navigate = useOrgNavigate();
  const access = useMentorshipAccessState();

  const resolved = !access.isLoading;
  const blocked = resolved && !access.isMentorApproved;

  useEffect(() => {
    if (!resolved) return;
    if (!blocked) return;
    if (access.isGuest) {
      navigate('/auth/login', { replace: true });
    } else if (!access.canUseMentorship) {
      navigate(MENTORSHIP_LANDING, { replace: true });
    } else if (access.hasMentorProfile) {
      navigate('/mentorship/profile', { replace: true });
    } else {
      navigate('/mentorship/signup', { replace: true });
    }
  }, [
    resolved,
    blocked,
    access.isGuest,
    access.canUseMentorship,
    access.hasMentorProfile,
    navigate,
  ]);

  if (!resolved || blocked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <LoadingSkeleton />
      </Box>
    );
  }

  return children;
};

export default MentorshipApprovedMentorGate;
