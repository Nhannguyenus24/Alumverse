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

const useAdminSystemData = () => {
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
      setActiveOrgId(state.organizations[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.organizations]);

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
