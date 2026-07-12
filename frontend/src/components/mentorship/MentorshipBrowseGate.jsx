import { useEffect } from 'react';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { MENTORSHIP_LANDING } from '../../constants/mentorshipNav';

/**
 * Redirects guest and level-0 users away from mentor browse routes.
 */
const MentorshipBrowseGate = ({ children }) => {
  const navigate = useOrgNavigate();
  const access = useMentorshipAccessState();

  const blocked = !access.isLoading && (access.isGuest || access.needsEmailVerification);

  useEffect(() => {
    if (blocked) {
      navigate(MENTORSHIP_LANDING, { replace: true });
    }
  }, [blocked, navigate]);

  if (access.isLoading || blocked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <LoadingSkeleton />
      </Box>
    );
  }

  return children;
};

export default MentorshipBrowseGate;
