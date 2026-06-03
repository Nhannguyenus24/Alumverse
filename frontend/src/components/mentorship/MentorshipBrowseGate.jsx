import { useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { MENTORSHIP_LANDING } from '../../constants/mentorshipNav';

/**
 * Redirects guest and level-0 users away from mentor browse routes.
 */
const MentorshipBrowseGate = ({ children }) => {
  const navigate = useOrgNavigate();
  const access = useMentorshipAccessState();

  const blocked = access.isGuest || access.needsEmailVerification;

  useEffect(() => {
    if (!access.isLoading && blocked) {
      navigate(MENTORSHIP_LANDING, { replace: true });
    }
  }, [access.isLoading, blocked, navigate]);

  if (access.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (blocked) {
    return null;
  }

  return children;
};

export default MentorshipBrowseGate;
