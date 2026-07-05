import { useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router';
import useOrganizationStore from '../stores/organizationStore';

/**
 * Organization hook backed by the organization store.
 * - Auto-fetches on first slug resolution.
 * - Re-fetches when slug changes.
 * - Avoids duplicate requests while loading.
 * - Switching to a different organization is handled seamlessly by
 *   fetchOrganization (rotates access/refresh tokens via /auth/switch-organization);
 *   the user stays logged in — non-members simply get verificationLevel 0.
 */
export const useOrganization = ({ enabled = true } = {}) => {
  const { slug: routeSlug } = useParams();

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

    // Keep one in-flight request per slug and avoid automatic retry loop on error.
    // On an org switch (currentSlug !== slug) this falls through so fetchOrganization
    // runs and seamlessly rotates the session tokens for the new org.
    if (currentSlug === slug && (loading || organization || error)) return;

    fetchOrganization(slug);
  }, [enabled, slug, currentSlug, loading, organization, error, fetchOrganization]);

  const isOrganizationNotFound = statusCode === 404;
  const isServerError = statusCode >= 500;

  const refetch = useCallback(() => {
    return enabled && slug ? fetchOrganization(slug) : Promise.resolve();
  }, [enabled, slug, fetchOrganization]);

  return useMemo(() => ({
    slug,
    organization,
    loading,
    error,
    isOrganizationNotFound,
    isServerError,
    fetchOrganization,
    refetch,
    reset,
  }), [slug, organization, loading, error, isOrganizationNotFound, isServerError, fetchOrganization, refetch, reset]);
};
