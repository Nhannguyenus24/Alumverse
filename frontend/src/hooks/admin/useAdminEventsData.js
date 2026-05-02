import { useCallback, useEffect, useMemo, useState } from 'react';
import { includesQuery, paginateRows, sortByField } from '../../utils/adminTableState';
import { eventApi } from '../../api/eventApi';

const EVENT_SEARCH_KEYS = ['title', 'organizerName', 'location', 'status'];

const normalizePaginated = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const mapEventStatus = (event) => {
  const raw = String(event?.status || '').toUpperCase();
  if (raw) return raw;
  if (event?.isPublished === true) return 'PUBLISHED';
  const end = new Date(event?.endDate || event?.timeEnded || 0).getTime();
  if (!Number.isNaN(end) && end < Date.now()) return 'CLOSED';
  return 'DRAFT';
};

const mapEventRow = (event) => ({
  id: event.id,
  title: event.title || event.name || 'Untitled',
  organizerName: event.organizerName || event.createdByName || event.managerName || '-',
  organizationId: event.organizationId ?? null,
  creatorMemberId: event.creatorMemberId ?? event.createdByMemberId ?? null,
  isPublished: event.isPublished ?? mapEventStatus(event) === 'PUBLISHED',
  status: mapEventStatus(event),
  location: event.location || '-',
  startDate: event.startDate || event.startTime || event.timeStarted || null,
  endDate: event.endDate || event.endTime || event.timeEnded || null,
  startTime: event.startTime || event.startDate || event.timeStarted || null,
  endTime: event.endTime || event.endDate || event.timeEnded || null,
  registrationStartAt: event.registrationStartAt || null,
  registrationEndAt: event.registrationEndAt || null,
  registeredCount: event.registeredCount ?? event.currentParticipants ?? 0,
  maxCapacity: event.maxCapacity ?? event.capacity ?? event.maxParticipants ?? 0,
  interestedCount: event.interestedCount ?? 0,
  updatedAt: event.updatedAt || event.createdAt || new Date().toISOString(),
  createdAt: event.createdAt || event.updatedAt || null,
  description: event.description || '',
  bannerUrl: event.bannerUrl || '',
  _raw: event,
});

const useAdminEventsData = () => {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [organizationFilter, setOrganizationFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadEvents = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await eventApi.getAdminEvents({ page: 0, size: 500 });
      const rows = normalizePaginated(data).map(mapEventRow);
      setAllRows(rows);
    } catch {
      setAllRows([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const data = await eventApi.getAdminEventStatistics();
      setStatistics(data || null);
    } catch {
      setStatistics(null);
    }
  }, []);

  const loadOrganizations = useCallback(async () => {
    try {
      const rows = await eventApi.getAdminOrganizations({ page: 0, size: 200 });
      setOrganizations(Array.isArray(rows) ? rows : []);
    } catch {
      setOrganizations([]);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadStatistics();
    loadOrganizations();
  }, [loadStatistics, loadOrganizations]);

  const filteredRows = useMemo(() => {
    return allRows.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (organizationFilter !== 'ALL' && String(item.organizationId) !== String(organizationFilter)) return false;
      return includesQuery(item, EVENT_SEARCH_KEYS, search);
    });
  }, [allRows, search, statusFilter, organizationFilter]);

  const sortedRows = useMemo(
    () => sortByField(filteredRows, sortBy, sortOrder),
    [filteredRows, sortBy, sortOrder],
  );

  const pagedRows = useMemo(
    () => paginateRows(sortedRows, page, rowsPerPage),
    [sortedRows, page, rowsPerPage],
  );

  const publishEvent = useCallback(async (id) => {
    try {
      setAllRows((prev) => prev.map((row) => (
        row.id === id
          ? { ...row, isPublished: true, status: 'PUBLISHED', updatedAt: new Date().toISOString() }
          : row
      )));
      await eventApi.publishAdminEvent(id);
      loadStatistics();
      return true;
    } catch {
      await loadEvents({ silent: true });
      return false;
    }
  }, [loadEvents, loadStatistics]);

  const unpublishEvent = useCallback(async (id) => {
    try {
      setAllRows((prev) => prev.map((row) => (
        row.id === id
          ? { ...row, isPublished: false, status: 'DRAFT', updatedAt: new Date().toISOString() }
          : row
      )));
      await eventApi.unpublishAdminEvent(id);
      loadStatistics();
      return true;
    } catch {
      await loadEvents({ silent: true });
      return false;
    }
  }, [loadEvents, loadStatistics]);

  const updateEvent = useCallback(async (id, payload) => {
    try {
      await eventApi.updateAdminEvent(id, payload);
      await loadEvents({ silent: true });
      return true;
    } catch {
      return false;
    }
  }, [loadEvents]);

  const deleteEvent = useCallback(async (id) => {
    try {
      await eventApi.deleteAdminEvent(id);
      setAllRows((prev) => prev.filter((row) => row.id !== id));
      loadStatistics();
      return true;
    } catch {
      return false;
    }
  }, [loadEvents, loadStatistics]);

  const createEvent = useCallback(async (payload) => {
    try {
      const created = await eventApi.createEvent(payload);
      if (created) {
        setAllRows((prev) => [mapEventRow(created), ...prev]);
      } else {
        await loadEvents({ silent: true });
      }
      loadStatistics();
      return true;
    } catch {
      return false;
    }
  }, [loadEvents, loadStatistics]);

  return {
    events: pagedRows,
    totalItems: sortedRows.length,
    filteredCount: sortedRows.length,
    loading,
    statistics,
    organizations,
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
    createEvent,
    updateEvent,
    deleteEvent,
    updateStatus: async (id, status) => (status === 'PUBLISHED' ? publishEvent(id) : unpublishEvent(id)),
    deleteItem: deleteEvent,
  };
};

export default useAdminEventsData;
