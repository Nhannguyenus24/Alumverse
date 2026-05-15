import { useNavigate as useRouterNavigate, useParams } from 'react-router';
import useOrganizationStore from '../stores/organizationStore';

/**
 * Custom hook to navigate with organization slug automatically
 * Wraps React Router's useNavigate() to prepend slug to paths
 * 
 * Usage:
 * const navigate = useOrgNavigate();
 * navigate('/dashboard');  // Becomes /:slug/dashboard
 * navigate('/auth/login');  // Becomes /:slug/auth/login
 * navigate('/');  // Becomes /:slug
 */
export const useOrgNavigate = () => {
  const routerNavigate = useRouterNavigate();
  const toOrgPath = useOrgPath();

  return (path, options = {}) => {
    if (typeof path !== 'string') {
      return routerNavigate(path, options);
    }

    return routerNavigate(toOrgPath(path), options);
  };
};

export const useOrgPath = () => {
  const { slug: routeSlug } = useParams();
  const currentSlug = useOrganizationStore((state) => state.currentSlug);
  const organizationSlug = useOrganizationStore((state) => state.organization?.slug);
  const slug = organizationSlug || currentSlug || routeSlug || null;
  const globalPrefixes = ['/admin', '/404', '/api'];

  return (path) => {
    // If path is external/global, use as-is.
    if (
      path.startsWith('http://')
      || path.startsWith('https://')
      || path.startsWith('mailto:')
      || path.startsWith('tel:')
      || globalPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
    ) {
      return path;
    }

    // If slug is unavailable, route to 404 instead of producing /null/*.
    if (!slug) {
      return '/404';
    }

    if (path === `/${slug}` || path.startsWith(`/${slug}/`)) {
      return path;
    }

    // Prepend slug to path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return normalizedPath === '/' ? `/${slug}` : `/${slug}${normalizedPath}`;
  };
};