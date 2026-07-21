import { useCallback, useEffect, useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import apiClient from '../../utils/axios';
import { useDebounce } from '../useDebounce';
import useAuthStore from '../../stores/authStore';

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
    enqueueSnackbar('Không tải được dữ liệu tổ chức. Vui lòng thử lại.', { variant: 'error' });
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

const ORG_LOCAL_TOUCH_KEY = 'admin-organizations-local-touch';

const readLocalTouchMap = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(ORG_LOCAL_TOUCH_KEY) || '{}') || {};
  } catch {
    return {};
  }
};

export const touchOrganizationInStorage = (orgId) => {
  if (typeof window === 'undefined' || !orgId) return;
  try {
    const map = readLocalTouchMap();
    map[String(orgId)] = new Date().toISOString();
    window.sessionStorage.setItem(ORG_LOCAL_TOUCH_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
};

const getOrganizationSortTime = (org, touchMap) => {
  const localTime = touchMap[String(org.id)];
  const val = localTime || org.updatedAt || org.updated_at || org.createdAt || org.created_at;
  const time = val ? new Date(val).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

export const sortOrganizationsByRecent = (organizations, touchMap = readLocalTouchMap()) => {
  return [...organizations].sort((a, b) => {
    const recentDiff = getOrganizationSortTime(b, touchMap) - getOrganizationSortTime(a, touchMap);
    if (recentDiff !== 0) {
      return recentDiff;
    }
    return Number(a.id || 0) - Number(b.id || 0);
  });
};

const useAdminSystemData = (preferredOrganization = {}) => {
  const [loading, setLoading] = useState(true);
  const [activeOrgId, setActiveOrgIdState] = useState(null);

  // stableOrgId: debounced 350ms — used by all data hooks as query param.
  // Prevents API storms when user rapidly switches orgs (only fires after
  // 350ms of inactivity). activeOrgId stays instant for the header dropdown.
  const stableOrgId = useDebounce(activeOrgId, 350);

  const [state, setState] = useState({
    organizations: [],
  });

  const setActiveOrgId = useCallback((id) => {
    if (id) {
      touchOrganizationInStorage(id);
      setActiveOrgIdState(id);
      setState((prev) => ({
        ...prev,
        organizations: sortOrganizationsByRecent(prev.organizations),
      }));
    } else {
      setActiveOrgIdState(id);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);

    const role = useAuthStore.getState().user?.role;
    const organizations = role === 'STAFF' && preferredOrganization?.slug
      ? await fetchSafe(() => apiClient.get(`/organizations/${preferredOrganization.slug}`), null)
      : await fetchSafe(() => apiClient.get('/admin/organizations', { params: { page: 0, size: 100 } }), []);

    const normalizedOrgs = role === 'STAFF'
      ? (organizations ? [organizations] : [])
      : normalizeList(organizations);

    const touchMap = readLocalTouchMap();
    const sortedOrgs = role === 'STAFF' ? normalizedOrgs : sortOrganizationsByRecent(normalizedOrgs, touchMap);

    setState({
      organizations: sortedOrgs,
    });

    setLoading(false);
   
  }, [preferredOrganization?.slug]);

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
  }), [loading, activeOrgId, stableOrgId, activeOrganization, loadData, state, setActiveOrgId]);
};

export default useAdminSystemData;
