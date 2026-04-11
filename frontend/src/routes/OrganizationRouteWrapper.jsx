import { useParams } from 'react-router';
import { OrganizationProvider } from '../contexts/OrganizationContext';
import OrganizationLayout from '../layouts/OrganizationLayout';
import NotFoundPage from '../pages/error/NotFoundPage';

/**
 * OrganizationRouteWrapper - Wraps organization-specific routes
 * Extracts slug from URL params and provides OrganizationContext
 * If no slug provided, shows 404 page
 */
const OrganizationRouteWrapper = ({ children }) => {
  const { slug } = useParams();

  // If no slug provided, show 404 page
  if (!slug || slug.trim() === '') {
    return <NotFoundPage />;
  }

  return (
    <OrganizationProvider slug={slug}>
      <OrganizationLayout>
        {children}
      </OrganizationLayout>
    </OrganizationProvider>
  );
};

export default OrganizationRouteWrapper;
