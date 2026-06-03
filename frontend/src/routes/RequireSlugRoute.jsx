import { Navigate, useLocation, useParams } from 'react-router';
import { useOrganization } from '../hooks/useOrganization';
import { isBlockedOrgFetchPath } from './routeGuards';
import LoadingScreen from '../components/LoadingScreen';

const RequireSlugRoute = ({ children }) => {
  const { slug } = useParams();
  const { pathname } = useLocation();

  const isBlockedErrorPath = isBlockedOrgFetchPath(pathname);

  const { organization, loading, isOrganizationNotFound, isServerError, error } = useOrganization({ enabled: !isBlockedErrorPath });

  // If slug is missing in URL, it's not a valid organization-prefixed route
  if (!slug) {
    return <Navigate to="/404" replace />;
  }

  // Handle server errors (500+)
  if (isServerError) {
    return <Navigate to="/500" replace />;
  }

  /**
   * Determine if we are still in a "loading" or "resolving" state.
   * - Explicit loading flag from store.
   * - No organization/error/404 yet (initial mount gap).
   * - Organization is stale (loaded for a different slug than current URL).
   */
  const isStale = organization && organization.slug !== slug;
  const isInitialLoad = !organization && !loading && !error && !isOrganizationNotFound;

  if (loading || isStale || isInitialLoad) {
    return <LoadingScreen message="Đang tải dữ liệu tổ chức..." />;
  }

  /**
   * Final validation: redirect to 404 if:
   * - Explicit 404 from server.
   * - Finished loading but no organization object was found.
   * - Organization object exists but is invalid (e.g., missing ID).
   */
  const isInvalidOrganization = !organization || !organization.id;

  if (isOrganizationNotFound || (isInvalidOrganization && !loading)) {
    return <Navigate to="/404" replace />;
  }

  return children;
};

export default RequireSlugRoute;
