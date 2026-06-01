import { useCallback, useEffect, useMemo, useState } from 'react';
import { includesQuery, paginateRows, sortByField } from '../../utils/adminTableState';
import { fundApi } from '../../utils/api';

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
  // If payload is already the inner data object (due to unwrap in fundApi)
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  
  // If payload still has a data wrapper (double nesting)
  const nestedData = payload?.data;
  if (Array.isArray(nestedData)) return nestedData;
  if (Array.isArray(nestedData?.items)) return nestedData.items;
  if (Array.isArray(nestedData?.content)) return nestedData.content;

  return [];
};

const useAdminFundraisingsData = (organizationId) => {
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
      const params = { page: 0, limit: 200 };
      if (organizationId) {
        params.organizationId = organizationId;
      }
      const data = await fundApi.getFunds(params);
      const rows = extractFunds(data).map(mapFundRow);
      setAllRows(rows);
    } catch {
      setAllRows([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const [reloadTrigger, setReloadTrigger] = useState(0);
  const reload = useCallback(() => setReloadTrigger((prev) => prev + 1), []);

  useEffect(() => {
    loadFunds();
  }, [loadFunds, reloadTrigger]);

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
    reload,
  };
};

export default useAdminFundraisingsData;
