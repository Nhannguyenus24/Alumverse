import { useEffect } from 'react';
import { useParams } from 'react-router';
import { OrganizationProvider } from    '../contexts/OrganizationContext';
import { OrganizationMembershipProvider } from '../contexts/OrganizationMembershipContext';
import OrganizationLayout from '../layouts/OrganizationLayout';
import NotFoundPage from '../pages/error/NotFoundPage';
import OrganizationMembershipGuard from './OrganizationMembershipGuard';

/**
 * OrganizationRouteWrapper - Wraps organization-specific routes
 * Extracts slug from URL params and provides OrganizationContext
 * If no slug provided, shows 404 page
 */
const OrganizationRouteWrapper = ({ children }) => {
  const { slug } = useParams();

  useEffect(() => {
    console.info('[OrgRouteWrapper] Mounted/updated', { slug });
  }, [slug]);

  // If no slug provided, show 404 page
  if (!slug || slug.trim() === '') {
    console.warn('[OrgRouteWrapper] Missing slug, rendering NotFoundPage');
    return <NotFoundPage />;
  }

  return (
    <OrganizationProvider slug={slug}>
      <OrganizationMembershipProvider>
        <OrganizationMembershipGuard>
          <OrganizationLayout>
            {children}
          </OrganizationLayout>
        </OrganizationMembershipGuard>
      </OrganizationMembershipProvider>
    </OrganizationProvider>
  );
};

export default OrganizationRouteWrapper;
