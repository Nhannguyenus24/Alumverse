import { useOrganization } from '../hooks/useOrganization';
import LoadingScreen from '../components/LoadingScreen';
import NotFoundPage from '../pages/error/NotFoundPage';

/**
 * OrganizationLayout - Handles organization context loading and error states
 * Shows loading screen while organization data is being fetched
 * Shows 404 page if organization doesn't exist
 * Renders children when organization is loaded successfully
 */
const OrganizationLayout = ({ children }) => {
  const { organization, loading, error } = useOrganization();

  // Show loading screen while fetching organization
  if (loading) {
    return <LoadingScreen />;
  }

  // Show 404 if organization doesn't exist
  if (error || !organization) {
    return <NotFoundPage />;
  }

  // Render children when organization is loaded
  return children;
};

export default OrganizationLayout;
