import { Navigate, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/LoadingScreen";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { slug } = useParams();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect authenticated users away from public routes (like login/register)
  if (isAuthenticated) {
    return <Navigate to={slug ? `/${slug}` : "/404"} replace />;
  }

  return children;
};

export default PublicRoute;