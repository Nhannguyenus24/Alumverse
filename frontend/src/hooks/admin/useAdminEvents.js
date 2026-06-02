import { useCallback, useEffect, useMemo, useState } from 'react';
import * as api from '../../utils/api';
import { organizationApi } from '../../utils/api';

const fallbackPage = { items: [], totalItem: 0, totalPage: 0, currentPage: 0, pageSize: 10 };
const fallbackStatistics = null;

const extractData = (response) => response?.data?.data ?? response?.data ?? null;

const safeFetch = async (request, fallback) => {
  try {
    const data = extractData(await request());
    return data ?? fallback;
  } catch {
    return fallback;
  }
};

const useAdminEvents = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [organizationFilter, setOrganizationFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [paged, setPaged] = useState(fallbackPage);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(fallbackStatistics);
  const [organizations, setOrganizations] = useState([]);

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

  const loadEvents = useCallback(async () => {
    setLoading(true);
    let data;
    const trimmed = search.trim();
    const orgId = organizationFilter !== 'ALL' ? Number(organizationFilter) : null;

    if (trimmed.length > 0) {
      data = await safeFetch(
        () => api.searchAllEvents(trimmed, page, rowsPerPage),
        fallbackPage,
      );
    } else if (orgId) {
      data = await safeFetch(
        () => api.getEventsByOrganization(orgId, page, rowsPerPage),
        fallbackPage,
      );
    } else if (statusFilter === 'PUBLISHED') {
      data = await safeFetch(
        () => api.getEventsByPublishStatus(true, page, rowsPerPage),
        fallbackPage,
      );
    } else if (statusFilter === 'DRAFT') {
      data = await safeFetch(
        () => api.getEventsByPublishStatus(false, page, rowsPerPage),
        fallbackPage,
      );
    } else {
      data = await safeFetch(() => api.getAllEvents(page, rowsPerPage), fallbackPage);
    }
    setPaged(data || fallbackPage);
    setLoading(false);
  }, [page, rowsPerPage, search, statusFilter, organizationFilter]);

  useEffect(() => {
    const timer = setTimeout(loadEvents, 0);
    return () => clearTimeout(timer);
  }, [loadEvents]);

  const loadStatistics = useCallback(async () => {
    const data = await safeFetch(() => api.getEventStatistics(), fallbackStatistics);
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
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return items;
  }, [paged, sortBy, sortOrder]);

  const publishEvent = useCallback(async (eventId) => {
    try {
      await api.publishEvent(eventId);
      await Promise.all([loadEvents(), loadStatistics()]);
      return true;
    } catch {
      return false;
    }
  }, [loadEvents, loadStatistics]);

  const unpublishEvent = useCallback(async (eventId) => {
    try {
      await api.unpublishEvent(eventId);
      await Promise.all([loadEvents(), loadStatistics()]);
      return true;
    } catch {
      return false;
    }
  }, [loadEvents, loadStatistics]);

  const deleteEvent = useCallback(async (eventId) => {
    try {
      await api.deleteEvent(eventId);
      await Promise.all([loadEvents(), loadStatistics()]);
      return true;
    } catch {
      return false;
    }
  }, [loadEvents, loadStatistics]);

  const updateEvent = useCallback(async (eventId, payload) => {
    try {
      await api.updateEvent(eventId, payload);
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
