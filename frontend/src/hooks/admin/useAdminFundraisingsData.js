import { useCallback, useEffect, useMemo, useState } from 'react';
import { includesQuery, paginateRows, sortByField } from '../../utils/adminTableState';
import { fundApi } from '../../api/fundApi';

const SEARCH_KEYS = ['title', 'ownerName', 'status'];

const normalizeFundStatus = (value) => {
  const status = String(value || '').toUpperCase();
  if (status === 'OPEN') return 'ACTIVE';
  if (status) return status;
  return 'DRAFT';
};

const mapFundRow = (fund) => ({
  id: fund.id,
  title: fund.name || fund.title || 'Untitled fund',
  status: normalizeFundStatus(fund.statusName || fund.status || fund.fundStatusName),
  ownerName: fund.managerName || fund.ownerName || '-',
  targetAmount: Number(fund.targetAmount || 0),
  raisedAmount: Number(fund.raisedAmount || fund.currentAmount || 0),
  donorCount: Number(fund.donorCount || fund.totalDonors || 0),
  updatedAt: fund.updatedAt || fund.timeUpdated || fund.createdAt || new Date().toISOString(),
});

const extractFunds = (payload) => {
  const data = payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
};

const useAdminFundraisingsData = () => {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadFunds = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await fundApi.getFunds({ page: 0, limit: 200 });
      const rows = extractFunds(data).map(mapFundRow);
      setAllRows(rows);
    } catch {
      setAllRows([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFunds();
  }, [loadFunds]);

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
      if (status === 'COMPLETED') {
        await fundApi.closeFund(id);
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
    fundraisings: pagedRows,
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

export default useAdminFundraisingsData;
