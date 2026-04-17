import { Navigate, useLocation, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/LoadingScreen";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const { slug } = useParams();

  const buildOrgPath = (path) => (slug ? `/${slug}${path}` : "/404");

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={buildOrgPath("/auth/login")} replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      return <Navigate to={buildOrgPath("/unauthorized")} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;