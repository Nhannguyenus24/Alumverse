import { useCallback, useEffect, useState } from 'react';
import { fundApi } from '../../utils/api';

const useAdminFundReceivingInfosData = () => {
  const [accounts, setAccounts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const reload = useCallback(() => setReloadTrigger((prev) => prev + 1), []);

  const submitSearch = useCallback(() => {
    setSearchQuery(search.trim());
    setPage(0);
  }, [search]);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const params = { page, limit: rowsPerPage };
      if (searchQuery) params.q = searchQuery;

      const payload = await fundApi.getFundReceivingInfos(params);
      const paged = payload?.data ?? payload;
      setAccounts(Array.isArray(paged?.items) ? paged.items : []);
      setTotalCount(Number(paged?.totalItem ?? 0));
    } catch {
      setAccounts([]);
      setTotalCount(0);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchQuery]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts, reloadTrigger]);

  return {
    accounts,
    totalCount,
    loading,
    loadError,
    search,
    setSearch,
    submitSearch,
    searchQuery,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    reload,
  };
};

export default useAdminFundReceivingInfosData;
