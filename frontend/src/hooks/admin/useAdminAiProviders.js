import { useCallback, useEffect, useState } from 'react';
import apiClient from '../../utils/axios';

const BASE = '/admin/ai-providers';

const extractData = (response) => response?.data?.data ?? response?.data ?? null;

const useAdminAiProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = extractData(await apiClient.get(BASE));
      setProviders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e);
      setProviders([]);
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

  const test = useCallback(async (id, model) => {
    return extractData(await apiClient.post(`${BASE}/${id}/test`, null, { params: { model } }));
  }, []);

  return { providers, loading, error, refresh: load, create, update, remove, test };
};

export default useAdminAiProviders;
