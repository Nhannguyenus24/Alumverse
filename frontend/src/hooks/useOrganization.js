import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import useOrganizationStore from '../stores/organizationStore';

/**
 * Organization hook backed by the organization store.
 * - Auto-fetches on first slug resolution.
 * - Re-fetches when slug changes.
 * - Avoids duplicate requests while loading.
 */
export const useOrganization = () => {
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
    if (!slug) return;

    // Keep one in-flight request per slug and avoid automatic retry loop on error.
    if (currentSlug === slug && (loading || organization || error)) return;

    fetchOrganization(slug);
  }, [slug, currentSlug, loading, organization, error, fetchOrganization]);

  const isOrganizationNotFound = statusCode === 404;

  return {
    slug,
    organization,
    loading,
    error,
    isOrganizationNotFound,
    fetchOrganization,
    refetch: () => (slug ? fetchOrganization(slug) : Promise.resolve()),
    reset,
  };
};
