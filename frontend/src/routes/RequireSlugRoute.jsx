import { Navigate, useParams } from 'react-router';

const RequireSlugRoute = ({ children }) => {
  const { slug } = useParams();

  if (!slug) {
    return <Navigate to="/404" replace />;
  }

  return children;
};

export default RequireSlugRoute;
