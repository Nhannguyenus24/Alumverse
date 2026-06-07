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
  const [totalCount, setTotalCount] = useState(0);
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
      const params = { page, limit: rowsPerPage };
      if (organizationId) params.organizationId = organizationId;
      if (search && search.trim() !== '') params.q = search.trim();
      
      // Map statusFilter to backend status ID if needed
      if (statusFilter !== 'ALL') {
        const statusMap = { ACTIVE: 1, PAUSED: 2, COMPLETED: 3, DRAFT: 4 };
        if (statusMap[statusFilter]) {
          params.statusId = statusMap[statusFilter];
        }
      }

      const data = await fundApi.getFunds(params);
      const rows = extractFunds(data).map(mapFundRow);
      setAllRows(rows);
      
      // Calculate total count
      const totalElements = data?.data?.totalItem || data?.totalItem || rows.length;
      setTotalCount(totalElements > 200 ? totalElements : (data?.data?.totalElements || data?.totalElements || totalElements));

    } catch {
      setAllRows([]);
      setTotalCount(0);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [organizationId, page, rowsPerPage, search, statusFilter]);

  const [reloadTrigger, setReloadTrigger] = useState(0);
  const reload = useCallback(() => setReloadTrigger((prev) => prev + 1), []);

  useEffect(() => {
    loadFunds();
  }, [loadFunds, reloadTrigger]);

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
    fundraisings: allRows,
    filteredCount: totalCount,
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
