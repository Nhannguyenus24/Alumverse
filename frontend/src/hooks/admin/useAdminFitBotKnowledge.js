import { useCallback, useEffect, useState } from 'react';
import apiClient from '../../utils/axios';

const BASE = '/admin/fitbot-knowledge';

const extractData = (response) => response?.data?.data ?? response?.data ?? null;

const useAdminFitBotKnowledge = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = extractData(await apiClient.get(BASE));
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (body) => {
    return extractData(await apiClient.post(BASE, body));
  }, []);

  const update = useCallback(async (id, body) => {
    return extractData(await apiClient.put(`${BASE}/${id}`, body));
  }, []);

  const remove = useCallback(async (id) => {
    return extractData(await apiClient.delete(`${BASE}/${id}`));
  }, []);

  const sync = useCallback(async (id) => {
    return extractData(await apiClient.post(`${BASE}/${id}/sync`));
  }, []);

  const syncAll = useCallback(async () => {
    return extractData(await apiClient.post(`${BASE}/sync-all`));
  }, []);

  return { items, loading, error, refresh: load, create, update, remove, sync, syncAll };
};

export default useAdminFitBotKnowledge;
