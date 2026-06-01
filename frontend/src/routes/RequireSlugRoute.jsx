import { Navigate, useLocation, useParams } from 'react-router';
import { useOrganization } from '../hooks/useOrganization';
import { isBlockedOrgFetchPath } from './routeGuards';

const RequireSlugRoute = ({ children }) => {
  const { slug } = useParams();
  const { pathname } = useLocation();

  const isBlockedErrorPath = isBlockedOrgFetchPath(pathname);

  const { loading, isOrganizationNotFound } = useOrganization({ enabled: !isBlockedErrorPath });

  if (!slug) {
    return <Navigate to="/404" replace />;
  }

  if (!loading && isOrganizationNotFound) {
    return <Navigate to="/404" replace />;
  }

  return children;
};

export default RequireSlugRoute;
