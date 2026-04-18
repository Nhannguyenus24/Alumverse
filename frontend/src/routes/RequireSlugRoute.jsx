import { Navigate, useParams } from 'react-router';
import { useOrganization } from '../hooks/useOrganization';

const RequireSlugRoute = ({ children }) => {
  const { slug } = useParams();

  // Route-level organization bootstrap for all slug-based paths.
  const { loading, isOrganizationNotFound } = useOrganization();

  if (!slug) {
    return <Navigate to="/404" replace />;
  }

  if (!loading && isOrganizationNotFound) {
    return <Navigate to="/404" replace />;
  }

  return children;
};

export default RequireSlugRoute;
