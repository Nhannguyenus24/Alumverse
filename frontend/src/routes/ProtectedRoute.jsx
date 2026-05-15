import { Navigate, useLocation, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/LoadingScreen";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const { slug } = useParams();

  // Check if this is an admin route (without slug)
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // For admin routes, don't require slug context
  const buildPath = (path) => {
    if (isAdminRoute) {
      return path;
    }
    return slug ? `/${slug}${path}` : "/404";
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // For admin routes, redirect to admin login page
    // For other routes, use regular login
    const loginPath = isAdminRoute ? "/admin/login" : buildPath("/auth/login");
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      // For admin routes, redirect to /unauthorized
      // For slug routes, redirect to slug-specific unauthorized page
      return <Navigate to={isAdminRoute ? "/unauthorized" : buildPath("/unauthorized")} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;