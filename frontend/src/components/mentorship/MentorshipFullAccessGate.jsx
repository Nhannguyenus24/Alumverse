import LoadingSkeleton from '../LoadingSkeleton';
import { useEffect } from 'react';
import {  Box } from '@mui/material';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { MENTORSHIP_LANDING } from '../../constants/mentorshipNav';

/** Redirects users below org-verified level (L2) away from booking and mentee tools. */
const MentorshipFullAccessGate = ({ children }) => {
  const navigate = useOrgNavigate();
  const access = useMentorshipAccessState();

  const resolved = !access.isLoading;
  const blocked = resolved && !access.canUseMentorship;

  useEffect(() => {
    if (!resolved) return;
    if (access.isGuest) {
      navigate('/auth/login', { replace: true });
    } else if (blocked) {
      navigate(MENTORSHIP_LANDING, { replace: true });
    }
  }, [resolved, access.isGuest, blocked, navigate]);

  if (!resolved || blocked || access.isGuest) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <LoadingSkeleton />
      </Box>
    );
  }

  return children;
};

export default MentorshipFullAccessGate;
