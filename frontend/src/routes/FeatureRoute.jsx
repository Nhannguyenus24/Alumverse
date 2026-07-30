import { Navigate } from 'react-router';

import { useFeatureEnabled } from '../hooks/useFeatureFlags';
import { useOrgPath } from '../hooks/useOrgNavigate';

/**
 * Route-level gate for organization features (forum, events, jobs, mentorship,
 * fundraising, ...). When the organization has the given feature disabled in its
 * `featuresConfig`, the user is redirected to the org home instead of being able
 * to reach the page by typing the URL directly.
 *
 * Features default to ENABLED, so a missing flag never blocks access. Every
 * FeatureRoute renders under RequireSlugRoute, which already blocks rendering
 * until the organization is loaded and valid — so no loading guard is needed here.
 */
const FeatureRoute = ({ feature, children }) => {
  const enabled = useFeatureEnabled(feature);
  const toOrgPath = useOrgPath();

  if (!enabled) {
    return <Navigate to={toOrgPath('/')} replace />;
  }

  return children;
};

export default FeatureRoute;
