import { Box, CircularProgress } from '@mui/material';
import { Navigate } from 'react-router';

import useOrganizationStore from '../stores/organizationStore';
import { useFeatureEnabled } from '../hooks/useFeatureFlags';
import { useOrgPath } from '../hooks/useOrgNavigate';

/**
 * Route-level gate for organization features (forum, events, jobs, mentorship,
 * fundraising, ...). When the organization has the given feature disabled in its
 * `featuresConfig`, the user is redirected to the org home instead of being able
 * to reach the page by typing the URL directly.
 *
 * Features default to ENABLED, so a missing flag never blocks access. While the
 * organization is still loading we render a spinner to avoid both flashing the
 * page and redirecting prematurely.
 */
const FeatureRoute = ({ feature, children }) => {
  const organization = useOrganizationStore((state) => state.organization);
  const loading = useOrganizationStore((state) => state.loading);
  const enabled = useFeatureEnabled(feature);
  const toOrgPath = useOrgPath();

  if (!organization && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!enabled) {
    return <Navigate to={toOrgPath('/')} replace />;
  }

  return children;
};

export default FeatureRoute;
