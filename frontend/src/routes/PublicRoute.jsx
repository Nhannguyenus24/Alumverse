import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useOrganization } from "../hooks/useOrganization";
import LoadingScreen from "../components/LoadingScreen";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { slug } = useOrganization();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect authenticated users away from public routes (like login/register)
  if (isAuthenticated) {
    return <Navigate to={`/${slug}/dashboard`} replace />;
  }

  return children;
};

export default PublicRoute;