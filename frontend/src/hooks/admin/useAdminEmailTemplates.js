import { useCallback, useEffect, useState } from 'react';
import apiClient from '../../utils/axios';

const BASE = '/admin/email-templates';

const extractData = (response) => response?.data?.data ?? response?.data ?? null;

/** Xây map dữ liệu mẫu {key: sample} từ định nghĩa variables của template. */
export const buildSampleData = (variables = []) =>
  (variables ?? []).reduce((acc, v) => {
    if (v?.key) acc[v.key] = v.sample ?? '';
    return acc;
  }, {});

const useAdminEmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = extractData(await apiClient.get(BASE));
      setTemplates(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getById = useCallback(async (id) => {
    return extractData(await apiClient.get(`${BASE}/${id}`));
  }, []);

  const update = useCallback(async (id, body) => {
    return extractData(await apiClient.put(`${BASE}/${id}`, body));
  }, []);

  const updateRegions = useCallback(async (id, body) => {
    return extractData(await apiClient.put(`${BASE}/${id}/regions`, body));
  }, []);

  const resetToDefault = useCallback(async (id) => {
    return extractData(await apiClient.post(`${BASE}/${id}/reset`));
  }, []);

  const preview = useCallback(async (body) => {
    return extractData(await apiClient.post(`${BASE}/preview`, body));
  }, []);

  const previewRegions = useCallback(async (id, body) => {
    return extractData(await apiClient.post(`${BASE}/${id}/preview`, body));
  }, []);

  const sendTest = useCallback(async (body) => {
    return extractData(await apiClient.post(`${BASE}/send-test`, body));
  }, []);

  return {
    templates, loading, error, refresh: load,
    getById, update, updateRegions, resetToDefault, preview, previewRegions, sendTest,
  };
};

export default useAdminEmailTemplates;
