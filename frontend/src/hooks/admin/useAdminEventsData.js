import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_ADMIN_EVENTS } from '../../constants/adminDefaultEvents';
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
  status: mapEventStatus(event),
  location: event.location || '-',
  startDate: event.startDate || event.timeStarted || null,
  endDate: event.endDate || event.timeEnded || null,
  registeredCount: event.registeredCount ?? event.currentParticipants ?? 0,
  capacity: event.capacity ?? event.maxParticipants ?? 0,
  updatedAt: event.updatedAt || event.createdAt || new Date().toISOString(),
  _raw: event,
});

const useAdminEventsData = () => {
  const [allRows, setAllRows] = useState(DEFAULT_ADMIN_EVENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadEvents = useCallback(async () => {
    try {
      const data = await eventApi.getEvents({ page: 0, limit: 200 });
      const rows = normalizePaginated(data).map(mapEventRow);
      if (rows.length > 0) {
        setAllRows(rows);
      }
    } catch {
      // keep fallback rows
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredRows = useMemo(() => {
    return allRows.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      return includesQuery(item, EVENT_SEARCH_KEYS, search);
    });
  }, [allRows, search, statusFilter]);

  const sortedRows = useMemo(
    () => sortByField(filteredRows, sortBy, sortOrder),
    [filteredRows, sortBy, sortOrder],
  );

  const pagedRows = useMemo(
    () => paginateRows(sortedRows, page, rowsPerPage),
    [sortedRows, page, rowsPerPage],
  );

  const updateStatus = useCallback(async (id, status) => {
    try {
      if (status === 'PUBLISHED') {
        await eventApi.publishEvent(id);
      } else if (status === 'DRAFT') {
        await eventApi.unpublishEvent(id);
      }
    } catch {
      // keep optimistic local state
    }
    setAllRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status, updatedAt: new Date().toISOString() } : row)),
    );
  }, []);

  const deleteItem = useCallback(async (id) => {
    try {
      await eventApi.deleteEvent(id);
    } catch {
      // remove locally as fallback behavior
    }
    setAllRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  return {
    events: pagedRows,
    filteredCount: sortedRows.length,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    updateStatus,
    deleteItem,
  };
};

export default useAdminEventsData;
