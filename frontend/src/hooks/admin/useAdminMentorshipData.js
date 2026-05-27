import { useCallback, useEffect, useMemo, useState } from 'react';
import { includesQuery, paginateRows, sortByField } from '../../utils/adminTableState';
import {
  cancelSession,
  updateSessionStatus,
} from '../../api/mentorshipApi';
import { adminMentorshipApi } from '../../api/adminMentorshipApi';

const SEARCH_KEYS = ['mentorName', 'menteeName', 'topic', 'status'];

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
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
      const data = await adminMentorshipApi.getAllSessions({ 
        page: 0, 
        size: 200 // Load a large batch for local filtering
      });
      const rows = extractList(data).map(mapSession);
      setAllRows(rows);
    } catch (error) {
      console.error('Failed to load mentorship sessions:', error);
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
