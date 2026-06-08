import { useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { MENTORSHIP_LANDING } from '../../constants/mentorshipNav';

/** Redirects users below org-verified level (L2) away from booking and mentee tools. */
const MentorshipFullAccessGate = ({ children }) => {
  const navigate = useOrgNavigate();
  const access = useMentorshipAccessState();

  const blocked = !access.canUseMentorship;

  useEffect(() => {
    if (!access.isLoading && !access.isGuest && blocked) {
      if (access.needsEmailVerification || access.needsOrgVerification) {
        navigate(MENTORSHIP_LANDING, { replace: true });
      }
    }
    if (!access.isLoading && access.isGuest) {
      navigate('/auth/login', { replace: true });
    }
  }, [access.isLoading, access.isGuest, blocked, access.needsEmailVerification, access.needsOrgVerification, navigate]);

  if (access.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (access.isGuest || blocked) {
    return null;
  }

  return children;
};

export default MentorshipFullAccessGate;
