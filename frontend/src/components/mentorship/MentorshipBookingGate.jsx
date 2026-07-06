import { useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { MENTORSHIP_LANDING } from '../../constants/mentorshipNav';

const MentorshipBookingGate = ({ children }) => {
  const navigate = useOrgNavigate();
  const access = useMentorshipAccessState();

  const resolved = !access.isLoading;
  const blockedNoAccess = resolved && !access.canUseMentorship;
  const blockedNotJoined = resolved && access.canUseMentorship && !access.hasJoinedMentorship;

  useEffect(() => {
    if (!resolved) return;
    if (access.isGuest) {
      navigate('/auth/login', { replace: true });
    } else if (blockedNoAccess) {
      navigate(MENTORSHIP_LANDING, { replace: true });
    } else if (blockedNotJoined) {
      navigate('/mentorship/mentee-signup', { replace: true });
    }
  }, [resolved, access.isGuest, blockedNoAccess, blockedNotJoined, navigate]);

  if (!resolved || access.isGuest || blockedNoAccess || blockedNotJoined) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return children;
};

export default MentorshipBookingGate;
