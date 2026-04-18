import { Navigate, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/LoadingScreen";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, needsOrganizationSetup } = useAuth();
  const { slug } = useParams();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect authenticated users away from public routes (like login/register)
  if (isAuthenticated) {
    if (needsOrganizationSetup) {
      return <Navigate to={slug ? `/${slug}/organization-registration` : "/404"} replace />;
    }

    return <Navigate to={slug ? `/${slug}/dashboard` : "/404"} replace />;
  }

  return children;
};

export default PublicRoute;