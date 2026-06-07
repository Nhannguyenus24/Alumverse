import { useCallback, useEffect, useState } from 'react';
import { fundApi } from '../../utils/api';

const useAdminFundReceivingInfosData = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const reload = useCallback(() => setReloadTrigger((prev) => prev + 1), []);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const items = await fundApi.getActiveFundReceivingInfos();
      setAccounts(Array.isArray(items) ? items : []);
    } catch {
      setAccounts([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts, reloadTrigger]);

  return {
    accounts,
    loading,
    loadError,
    reload,
  };
};

export default useAdminFundReceivingInfosData;
