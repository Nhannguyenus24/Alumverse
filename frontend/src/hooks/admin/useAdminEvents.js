import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { eventApi, organizationApi } from '../../utils/api';

const fallbackPage = { items: [], totalItem: 0, totalPage: 0, currentPage: 0, pageSize: 10 };
const fallbackStatistics = null;

const extractData = (response) => response?.data?.data ?? response?.data ?? response ?? null;

const safeFetch = async (request, fallback) => {
  try {
    const data = extractData(await request());
    return data ?? fallback;
  } catch (err) {
    if (err.name === 'CanceledError' || err.name === 'AbortError') {
      throw err;
    }
    return fallback;
  }
};

const useAdminEvents = (initialOrgId = 'ALL') => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [organizationFilter, setOrganizationFilter] = useState(initialOrgId);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [paged, setPaged] = useState(fallbackPage);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(fallbackStatistics);
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    if (initialOrgId) {
      setOrganizationFilter(initialOrgId);
      setPage(0);
    }
  }, [initialOrgId]);

  const loadOrganizations = useCallback(async () => {
    try {
      const orgs = await organizationApi.getAllOrganizations();
      setOrganizations(Array.isArray(orgs) ? orgs : []);
    } catch {
      setOrganizations([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadOrganizations, 0);
    return () => clearTimeout(timer);
  }, [loadOrganizations]);

  const abortRef = useRef(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    let data;
    const trimmed = search.trim();
    const orgId = organizationFilter !== 'ALL' ? Number(organizationFilter) : null;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const config = { signal: abortRef.current.signal };

    try {
      const params = { page, size: rowsPerPage };
      if (orgId) params.organizationId = orgId;

      if (trimmed.length > 0) {
        data = await safeFetch(
          () => eventApi.searchAdminEvents(trimmed, params, config),
          fallbackPage,
        );
      } else if (statusFilter === 'PUBLISHED') {
        data = await safeFetch(
          () => eventApi.getAdminEventsByPublishStatus(true, params, config),
          fallbackPage,
        );
      } else if (statusFilter === 'DRAFT') {
        data = await safeFetch(
          () => eventApi.getAdminEventsByPublishStatus(false, params, config),
          fallbackPage,
        );
      } else {
        data = await safeFetch(() => eventApi.getAdminEvents(params, config), fallbackPage);
      }
      if (!config.signal.aborted) {
        setPaged(data || fallbackPage);
        setLoading(false);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setPaged(fallbackPage);
        setLoading(false);
      }
    }
  }, [page, rowsPerPage, search, statusFilter, organizationFilter]);

  useEffect(() => {
    const timer = setTimeout(loadEvents, 0);
    return () => clearTimeout(timer);
  }, [loadEvents]);

  const loadStatistics = useCallback(async () => {
    const data = await safeFetch(() => eventApi.getAdminEventStatistics(), fallbackStatistics);
    setStatistics(data);
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadStatistics, 0);
    return () => clearTimeout(timer);
  }, [loadStatistics]);

  const sortedRows = useMemo(() => {
    const items = Array.isArray(paged?.items) ? [...paged.items] : [];
    const dir = sortOrder === 'ASC' ? 1 : -1;
    items.sort((a, b) => {
      const av = a?.[sortBy];
      const bv = b?.[sortBy];
      if (av == null && bv == null) return (Number(b?.id) || 0) - (Number(a?.id) || 0);
      if (av == null) return 1;
      if (bv == null) return -1;

      const aTime = new Date(av).getTime();
      const bTime = new Date(bv).getTime();
      if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
        if (aTime !== bTime) return (aTime - bTime) * dir;
      } else {
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
      }

      return ((Number(a?.id) || 0) - (Number(b?.id) || 0)) * dir;
    });
    return items;
  }, [paged, sortBy, sortOrder]);

  const publishEvent = useCallback(async (eventId) => {
    try {
      await eventApi.publishAdminEvent(eventId);
      await Promise.all([loadEvents(), loadStatistics()]);
      return true;
    } catch {
      return false;
    }
  }, [loadEvents, loadStatistics]);

  const unpublishEvent = useCallback(async (eventId) => {
    try {
      await eventApi.unpublishAdminEvent(eventId);
      await Promise.all([loadEvents(), loadStatistics()]);
      return true;
    } catch {
      return false;
    }
  }, [loadEvents, loadStatistics]);

  const deleteEvent = useCallback(async (eventId) => {
    try {
      await eventApi.deleteAdminEvent(eventId);
      await Promise.all([loadEvents(), loadStatistics()]);
      return true;
    } catch {
      return false;
    }
  }, [loadEvents, loadStatistics]);

  const updateEvent = useCallback(async (eventId, payload) => {
    try {
      await eventApi.updateAdminEvent(eventId, payload);
      await Promise.all([loadEvents(), loadStatistics()]);
      return true;
    } catch {
      return false;
    }
  }, [loadEvents, loadStatistics]);

  return {
    events: sortedRows,
    totalItems: paged?.totalItem ?? 0,
    statistics,
    organizations,
    loading,

    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    organizationFilter,
    setOrganizationFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,

    publishEvent,
    unpublishEvent,
    deleteEvent,
    updateEvent,
    refresh: loadEvents,
  };
};

export default useAdminEvents;
