import { useCallback, useEffect, useMemo, useState } from 'react';
import { includesQuery, paginateRows, sortByField } from '../../utils/adminTableState';
import {
  cancelSession,
  getMyMenteeSessions,
  getMyMentorSessions,
  updateSessionStatus,
} from '../../api/mentorshipApi';

const SEARCH_KEYS = ['mentorName', 'menteeName', 'topic', 'status'];

const extractList = (payload) => {
  const data = payload?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const mapSession = (session) => ({
  id: session.id,
  mentorName: session.mentorName || session.mentorFullName || '-',
  menteeName: session.menteeName || session.menteeFullName || '-',
  topic: session.topic || session.note || session.title || '-',
  status: String(session.status || 'PENDING').toUpperCase(),
  sessionDate: session.sessionDate || session.startTime || session.createdAt,
  durationMinutes: session.durationMinutes || session.duration || 0,
  feedbackScore: session.feedbackScore ?? session.rating ?? null,
  updatedAt: session.updatedAt || session.createdAt || new Date().toISOString(),
});

const dedupeById = (rows) => {
  const map = new Map();
  rows.forEach((row) => map.set(row.id, row));
  return Array.from(map.values());
};

const useAdminMentorshipData = () => {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('sessionDate');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [mentorRes, menteeRes] = await Promise.all([
        getMyMentorSessions({ page: 0, limit: 100 }),
        getMyMenteeSessions({ page: 0, limit: 100 }),
      ]);
      const rows = dedupeById([
        ...extractList(mentorRes).map(mapSession),
        ...extractList(menteeRes).map(mapSession),
      ]);
      setAllRows(rows);
    } catch {
      setAllRows([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filteredRows = useMemo(() => {
    return allRows.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      return includesQuery(item, SEARCH_KEYS, search);
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
      if (status === 'CANCELLED') {
        await cancelSession(id);
      } else {
        await updateSessionStatus(id, { status });
      }
    } catch {
      // keep optimistic local state
    }
    setAllRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status, updatedAt: new Date().toISOString() } : row)),
    );
  }, []);

  const deleteItem = useCallback((id) => {
    setAllRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  return {
    mentorships: pagedRows,
    filteredCount: sortedRows.length,
    loading,
    loadError,
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

export default useAdminMentorshipData;
