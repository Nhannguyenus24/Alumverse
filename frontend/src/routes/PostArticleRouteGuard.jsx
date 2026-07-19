import { Navigate, useLocation, useParams } from "react-router";

import LoadingScreen from "../components/LoadingScreen";
import { useAuth } from "../hooks/useAuth";
import useOrganizationStore from "../stores/organizationStore";

const MANAGER_ONLY_CHANNELS = new Set(["news", "event"]);
const CONTRIBUTOR_CHANNELS = new Set(["alumni", "achievement", "job", "learning"]);

const PostArticleRouteGuard = ({ children, channel: explicitChannel }) => {
  const { channel: routeChannel } = useParams();
  const location = useLocation();
  const { isLoading, user, verificationLevel } = useAuth();
  const currentOrganizationId = useOrganizationStore((state) => state.organization?.id ?? null);

  if (isLoading) return <LoadingScreen />;

  const channel = String(explicitChannel ?? routeChannel ?? "news").toLowerCase();
  if (!MANAGER_ONLY_CHANNELS.has(channel) && !CONTRIBUTOR_CHANNELS.has(channel)) {
    return <Navigate to="/404" replace />;
  }

  const role = String(user?.role ?? "").toUpperCase();
  const level = Number(verificationLevel ?? 0);
  const tokenOrganizationId = user?.organizationId ?? null;
  const isCurrentOrganization =
    currentOrganizationId != null &&
    tokenOrganizationId != null &&
    Number(currentOrganizationId) === Number(tokenOrganizationId);
  const isAdmin = role === "ADMIN";
  const isCurrentOrgStaffManager = role === "STAFF" && level >= 4 && isCurrentOrganization;
  const isVerifiedContributor = role === "USER" && level >= 2 && isCurrentOrganization;

  const canAccess = MANAGER_ONLY_CHANNELS.has(channel)
    ? isAdmin || isCurrentOrgStaffManager
    : isAdmin || isCurrentOrgStaffManager || isVerifiedContributor;

  if (!canAccess) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ from: { pathname: `${location.pathname}${location.search}` } }}
      />
    );
  }

  return children;
};

export default PostArticleRouteGuard;
