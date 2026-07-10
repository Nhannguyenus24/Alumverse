import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import useOrganizationStore from '../stores/organizationStore';

const RESERVED_TOP_LEVEL_PATHS = new Set([
  'admin',
  '404',
  'unauthorized',
  '500',
  'maintenance',
  'api',
]);

const getFirstPathSegment = (path = '') => {
  const first = String(path).split('?')[0].split('#')[0].split('/').filter(Boolean)[0];
  return first && !RESERVED_TOP_LEVEL_PATHS.has(first) ? first : null;
};

export const useErrorPageActions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug: routeSlug } = useParams();
  const organization = useOrganizationStore((state) => state.organization);
  const currentSlug = useOrganizationStore((state) => state.currentSlug);
  const statusCode = useOrganizationStore((state) => state.statusCode);

  const currentFullPath = `${location.pathname}${location.search}${location.hash}`;
  const fromPath = typeof location.state?.from === 'string'
    ? location.state.from
    : null;

  const orgSlug = useMemo(() => {
    if (organization?.slug) return organization.slug;
    if (routeSlug && !RESERVED_TOP_LEVEL_PATHS.has(routeSlug)) return routeSlug;
    if (currentSlug && statusCode !== 404) return currentSlug;
    return getFirstPathSegment(fromPath);
  }, [currentSlug, fromPath, organization?.slug, routeSlug, statusCode]);

  const homePath = orgSlug ? `/${orgSlug}` : '/';

  const goHome = useCallback(() => {
    navigate(homePath, { replace: true });
  }, [homePath, navigate]);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    goHome();
  }, [goHome, navigate]);

  const retry = useCallback(() => {
    if (fromPath && fromPath !== currentFullPath) {
      navigate(fromPath, { replace: true });
      return;
    }
    window.location.reload();
  }, [currentFullPath, fromPath, navigate]);

  return {
    goBack,
    goHome,
    homePath,
    retry,
  };
};
