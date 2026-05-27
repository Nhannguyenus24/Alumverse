import { Navigate, useLocation, useParams } from 'react-router';
import { useOrganization } from '../hooks/useOrganization';
import { isAuthRoutePath, isBlockedOrgFetchPath } from './routeGuards';

const RequireSlugRoute = ({ children }) => {
  const { slug } = useParams();
  const { pathname } = useLocation();

  const isAuthPath = isAuthRoutePath(pathname);
  const isBlockedErrorPath = isBlockedOrgFetchPath(pathname);

  // Route-level organization bootstrap for slug pages, but skip auth screens.
  const { loading, isOrganizationNotFound } = useOrganization({ enabled: !isAuthPath && !isBlockedErrorPath });

  if (!slug) {
    return <Navigate to="/404" replace />;
  }

  if (!loading && isOrganizationNotFound) {
    return <Navigate to="/404" replace />;
  }

  return children;
};

export default RequireSlugRoute;
