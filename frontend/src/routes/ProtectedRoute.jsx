import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useOrganization } from "../hooks/useOrganization";
import LoadingScreen from "../components/LoadingScreen";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { slug } = useOrganization();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/${slug}/auth/login`} replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      return <Navigate to={`/${slug}/unauthorized`} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;