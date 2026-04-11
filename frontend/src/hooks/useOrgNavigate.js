import { useNavigate as useRouterNavigate } from 'react-router';
import { useOrganization } from './useOrganization';

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
  const { slug } = useOrganization();

  return (path, options = {}) => {
    // If path is already organization-scoped or is external, use as-is
    if (path.startsWith('http') || path.startsWith('/api')) {
      return routerNavigate(path, options);
    }

    // Prepend slug to path
    const orgPath = path === '/' ? `/${slug}` : `/${slug}${path}`;
    return routerNavigate(orgPath, options);
  };
};
