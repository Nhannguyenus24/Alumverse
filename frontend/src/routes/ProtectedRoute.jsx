import { Navigate, useLocation, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import useOrganizationStore from "../stores/organizationStore";
import LoadingScreen from "../components/LoadingScreen";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, user, mustChangePassword } = useAuth();
  const location = useLocation();
  const { slug } = useParams();
  const currentOrgId = useOrganizationStore((state) => state.organization?.id);

  // Check if this is the global admin route (no slug prefix, e.g. /admin/*)
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
    const loginPath = isAdminRoute ? "/admin/login" : buildPath("/auth/login");
    return <Navigate to={loginPath} replace state={{ from: { pathname: `${location.pathname}${location.search}` } }} />;
  }

  // Admin-provisioned accounts must change their password before accessing anything else.
  const changePasswordPath = isAdminRoute ? "/admin/change-password" : buildPath("/auth/change-password");
  if (mustChangePassword && location.pathname !== changePasswordPath) {
    return <Navigate to={changePasswordPath} replace />;
  }

  // STAFF cannot access the global /admin route (no slug); they belong to /:slug/admin only
  if (user?.role === 'STAFF' && isAdminRoute) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      return <Navigate to={isAdminRoute ? "/unauthorized" : buildPath("/unauthorized")} replace />;
    }
  }

  // STAFF on /:slug/admin: verify the slug's organization matches their assigned org
  if (user?.role === 'STAFF' && slug && user?.organizationId != null && currentOrgId != null) {
    if (user.organizationId !== currentOrgId) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
