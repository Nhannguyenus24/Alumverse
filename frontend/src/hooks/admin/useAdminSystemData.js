import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../utils/axios';
import { useDebounce } from '../useDebounce';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.items) return payload.items;
  if (payload?.content) return payload.content;
  if (payload?.data?.content) return payload.data.content;
  return [];
};

const fetchSafe = async (request, fallbackValue) => {
  try {
    const response = await request();
    const data = response?.data?.data ?? response?.data ?? null;
    return data ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const DEFAULT_ADMIN_ORGANIZATION_SLUG = 'cs-hcmus';

const pickPreferredOrganizationId = (organizations, preferred) => {
  if (!organizations.length) {
    return null;
  }

  const preferredSlugs = [
    preferred?.slug,
    preferred?.defaultSlug ?? DEFAULT_ADMIN_ORGANIZATION_SLUG,
  ].filter(Boolean);

  for (const preferredSlug of preferredSlugs) {
    const matchBySlug = organizations.find((org) => org.slug === preferredSlug);
    if (matchBySlug) {
      return matchBySlug.id;
    }
  }

  const preferredId = preferred?.id ?? preferred?.organizationId ?? null;
  if (preferredId != null) {
    const matchById = organizations.find((org) => String(org.id) === String(preferredId));
    if (matchById) {
      return matchById.id;
    }
  }

  return organizations[0].id;
};

const useAdminSystemData = (preferredOrganization = {}) => {
  const [loading, setLoading] = useState(true);
  const [activeOrgId, setActiveOrgId] = useState(null);

  // stableOrgId: debounced 350ms — used by all data hooks as query param.
  // Prevents API storms when user rapidly switches orgs (only fires after
  // 350ms of inactivity). activeOrgId stays instant for the header dropdown.
  const stableOrgId = useDebounce(activeOrgId, 350);

  const [state, setState] = useState({
    organizations: [],
  });

  const loadData = useCallback(async () => {
    setLoading(true);

    const [organizations] = await Promise.all([
      fetchSafe(() => apiClient.get('/admin/organizations', { params: { page: 0, size: 100 } }), []),
    ]);

    const normalizedOrgs = normalizeList(organizations);

    setState({
      organizations: normalizedOrgs,
    });

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run once on mount
  useEffect(() => {
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Set initial activeOrgId to first org once organizations are loaded (only if not already chosen)
  useEffect(() => {
    if (!activeOrgId && state.organizations.length > 0) {
      setActiveOrgId(pickPreferredOrganizationId(state.organizations, preferredOrganization));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.organizations, preferredOrganization?.id, preferredOrganization?.organizationId, preferredOrganization?.slug]);

  const activeOrganization = useMemo(() => {
    return state.organizations.find((o) => o.id === activeOrgId) || null;
  }, [activeOrgId, state.organizations]);

  return useMemo(() => ({
    loading,
    activeOrgId,    // Immediate — for header dropdown display
    stableOrgId,    // Debounced 350ms — use this as query param in all data hooks
    setActiveOrgId,
    activeOrganization,
    reload: loadData,
    ...state,
  }), [loading, activeOrgId, stableOrgId, activeOrganization, loadData, state]);
};

export default useAdminSystemData;
