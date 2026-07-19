import { Navigate, useLocation, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/LoadingScreen";
import useOrganizationStore from "../stores/organizationStore";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, user, mustChangePassword, verificationLevel } = useAuth();
  const location = useLocation();
  const { slug } = useParams();
  const currentOrganizationId = useOrganizationStore((state) => state.organization?.id ?? null);

  const isGlobalAdminRoute = /^\/admin(?:\/|$)/.test(location.pathname);
  const isSlugAdminRoute = /^\/[^/]+\/admin(?:\/|$)/.test(location.pathname);
  const isAnyAdminRoute = isGlobalAdminRoute || isSlugAdminRoute;

  // For admin routes, don't require slug context
  const buildPath = (path) => {
    if (isGlobalAdminRoute) {
      return path;
    }
    return slug ? `/${slug}${path}` : "/404";
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    const loginPath = isGlobalAdminRoute ? "/admin/login" : buildPath("/auth/login");
    return <Navigate to={loginPath} replace state={{ from: { pathname: `${location.pathname}${location.search}` } }} />;
  }

  // Admin-provisioned accounts must change their password before accessing anything else.
  const changePasswordPath = isGlobalAdminRoute ? "/admin/change-password" : buildPath("/auth/change-password");
  if (mustChangePassword && location.pathname !== changePasswordPath) {
    return <Navigate to={changePasswordPath} replace />;
  }

  // STAFF cannot access the global /admin route; they belong to /:slug/admin only.
  if (user?.role === 'STAFF' && isGlobalAdminRoute) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      return <Navigate to={isGlobalAdminRoute ? "/unauthorized" : buildPath("/unauthorized")} replace />;
    }
  }

  // STAFF only acts as staff in the organization where the backend grants
  // effective verification level 4. In other orgs they fall back to level 2
  // and cannot access staff admin pages.
  const tokenOrganizationId = user?.organizationId ?? null;
  const staffInCurrentOrganization =
    isSlugAdminRoute &&
    currentOrganizationId != null &&
    tokenOrganizationId != null &&
    Number(currentOrganizationId) === Number(tokenOrganizationId);

  if (user?.role === 'STAFF' && isAnyAdminRoute && (Number(verificationLevel ?? 0) < 4 || !staffInCurrentOrganization)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
