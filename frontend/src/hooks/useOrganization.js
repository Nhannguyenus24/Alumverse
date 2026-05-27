import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import useOrganizationStore from '../stores/organizationStore';
import useAuthStore from '../stores/authStore';
import apiClient from '../utils/axios';

/**
 * Organization hook backed by the organization store.
 * - Auto-fetches on first slug resolution.
 * - Re-fetches when slug changes.
 * - Avoids duplicate requests while loading.
 * - Logs out user when switching to a different organization (JWT is org-scoped).
 */
export const useOrganization = ({ enabled = true } = {}) => {
  const { slug: routeSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const currentSlug = useOrganizationStore((state) => state.currentSlug);
  const organization = useOrganizationStore((state) => state.organization);
  const loading = useOrganizationStore((state) => state.loading);
  const error = useOrganizationStore((state) => state.error);
  const statusCode = useOrganizationStore((state) => state.statusCode);
  const fetchOrganization = useOrganizationStore((state) => state.fetchOrganization);
  const reset = useOrganizationStore((state) => state.reset);

  const slug = useMemo(() => {
    return routeSlug || currentSlug || organization?.slug || null;
  }, [routeSlug, currentSlug, organization?.slug]);

  useEffect(() => {
    if (!enabled || !slug) return;

    const isOrgSwitch = currentSlug && currentSlug !== slug;
    const isAuthenticated = !!useAuthStore.getState().token;

    if (isOrgSwitch && isAuthenticated) {
      // JWT is scoped to organizationId — switching orgs requires a fresh login.
      // Fire-and-forget the logout API to clear the refresh token cookie, then
      // reset local state and redirect regardless of network outcome.
      apiClient.post('/auth/logout').finally(() => {
        useAuthStore.getState().reset();
        reset();
        navigate(`/${slug}/auth/login`, { replace: true });
      });
      return;
    }

    // Keep one in-flight request per slug and avoid automatic retry loop on error.
    if (currentSlug === slug && (loading || organization || error)) return;

    fetchOrganization(slug);
  }, [enabled, slug, currentSlug, loading, organization, error, fetchOrganization, navigate, reset, location.pathname]);

  const isOrganizationNotFound = statusCode === 404;

  return {
    slug,
    organization,
    loading,
    error,
    isOrganizationNotFound,
    fetchOrganization,
    refetch: () => (enabled && slug ? fetchOrganization(slug) : Promise.resolve()),
    reset,
  };
};
