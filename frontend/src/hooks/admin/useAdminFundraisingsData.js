import { useCallback, useEffect, useState, useRef } from 'react';
import { fundApi } from '../../utils/api';

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

const extractPagedFunds = (payload) => {
  const paged = payload?.data ?? payload;
  const items = Array.isArray(paged?.items)
    ? paged.items
    : Array.isArray(paged)
      ? paged
      : [];

  return {
    items,
    totalItem: Number(paged?.totalItem ?? items.length),
  };
};

const useAdminFundraisingsData = (organizationId) => {
  const [fundraisings, setFundraisings] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [organizationId]);

  const submitSearch = useCallback(() => {
    setSearchQuery(search.trim());
    setPage(0);
  }, [search]);

  // Expose a direct way to set the query and reset page, useful when debouncing externally
  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query.trim());
    setPage(0);
  }, []);

  const abortRef = useRef(null);

  const loadFunds = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const config = { signal: abortRef.current.signal };

    try {
      const params = {
        page,
        limit: rowsPerPage,
      };
      if (organizationId) {
        params.organizationId = String(organizationId);
      }
      if (searchQuery) {
        params.q = searchQuery;
      }

      const payload = await fundApi.getFunds(params, config);
      if (!config.signal.aborted) {
        const { items, totalItem } = extractPagedFunds(payload);
        setFundraisings(items.map(mapFundRow));
        setTotalCount(totalItem);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setFundraisings([]);
        setTotalCount(0);
        setLoadError(true);
      }
    } finally {
      if (!config.signal.aborted) {
        setLoading(false);
      }
    }
  }, [organizationId, page, rowsPerPage, searchQuery]);

  const [reloadTrigger, setReloadTrigger] = useState(0);
  const reload = useCallback(() => setReloadTrigger((prev) => prev + 1), []);

  useEffect(() => {
    loadFunds();
  }, [loadFunds, reloadTrigger]);

  const updateStatus = useCallback(async (id, status) => {
    if (status !== 'COMPLETED') return;

    try {
      await fundApi.closeFund(id);
      setFundraisings((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, status: 'COMPLETED', updatedAt: new Date().toISOString() } : row,
        ),
      );
    } catch {
      throw new Error('Failed to close fund');
    }
  }, []);

  return {
    fundraisings,
    filteredCount: totalCount,
    loading,
    loadError,
    search,
    setSearch,
    submitSearch,
    updateSearchQuery,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    updateStatus,
    reload,
  };
};

export default useAdminFundraisingsData;
