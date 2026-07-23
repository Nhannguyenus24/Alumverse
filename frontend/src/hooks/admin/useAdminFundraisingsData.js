import { useCallback, useEffect, useState, useRef } from 'react';
import { fundApi } from '../../utils/api';

const mapFundRow = (fund) => ({
  id: fund.id,
  title: fund.name || fund.title || 'Untitled fund',
  timeStarted: fund.timeStarted || null,
  timeEnded: fund.timeEnded || null,
  ownerName: fund.managerName || fund.ownerName || '-',
  targetAmount: Number(fund.targetAmount || 0),
  raisedAmount: Number(fund.raisedAmount || fund.currentAmount || 0),
  donorCount: Number(fund.donorCount || fund.totalDonors || 0),
  updatedAt: fund.updatedAt || fund.timeUpdated || fund.createdAt || new Date().toISOString(),
  donationListPublic: Boolean(fund.donationListPublic),
  fundDocumentUrl: fund.fundDocumentUrl || '',
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

const timestampOf = (fund) => {
  const raw = fund?.updatedAt || fund?.timeStarted || fund?.timeEnded;
  if (!raw) return 0;
  const timestamp = new Date(raw).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortFundsByTime = (items, order = 'DESC') => {
  const dir = order === 'ASC' ? 1 : -1;
  return [...items].sort((a, b) => {
    const at = timestampOf(a);
    const bt = timestampOf(b);
    if (at !== bt) return (at - bt) * dir;
    return ((Number(a?.id) || 0) - (Number(b?.id) || 0)) * dir;
  });
};

const useAdminFundraisingsData = (organizationId) => {
  const [fundraisings, setFundraisings] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrderState] = useState('DESC');
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
        setFundraisings(sortFundsByTime(items.map(mapFundRow), sortOrder));
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
  }, [organizationId, page, rowsPerPage, searchQuery, sortOrder]);

  const [reloadTrigger, setReloadTrigger] = useState(0);
  const reload = useCallback(() => setReloadTrigger((prev) => prev + 1), []);

  useEffect(() => {
    loadFunds();
  }, [loadFunds, reloadTrigger]);

  const closeFundById = useCallback(async (id) => {
    await fundApi.closeFund(id);
    const closedAt = new Date().toISOString();
    setFundraisings((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, timeEnded: closedAt, updatedAt: closedAt } : row,
      ),
    );
  }, []);

  const toggleDonationVisibility = useCallback(async (id, nextPublic) => {
    await fundApi.updateDonationVisibility(id, nextPublic);
    setFundraisings((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, donationListPublic: nextPublic } : row,
      ),
    );
  }, []);

  return {
    fundraisings,
    filteredCount: totalCount,
    loading,
    loadError,
    search,
    setSearch,
    sortOrder,
    setSortOrder: (order) => { setSortOrderState(order); setPage(0); },
    submitSearch,
    updateSearchQuery,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    closeFundById,
    toggleDonationVisibility,
    reload,
  };
};

export default useAdminFundraisingsData;
