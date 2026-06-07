import { useCallback, useEffect, useState } from 'react';
import apiClient from '../../utils/axios';

const ENDPOINT_BY_CHANNEL = {
  news: '/admin/articles/news',
  alumni: '/admin/articles/alumni-posts',
  achievement: '/admin/articles/achievements',
  job: '/admin/articles/jobs',
  learning: '/admin/articles/learning-resources',
  event: '/admin/articles/events',
  donation: '/admin/articles/funds',
};

const fallbackPage = { items: [], totalItem: 0, totalPage: 0, currentPage: 0, pageSize: 10 };

const extractData = (response) => response?.data?.data ?? response?.data ?? null;

const safeFetch = async (request, fallback) => {
  try {
    const data = extractData(await request());
    return data ?? fallback;
  } catch {
    return fallback;
  }
};

const normalizePage = (raw) => {
  if (!raw) return fallbackPage;
  if (Array.isArray(raw.items)) return raw;
  if (Array.isArray(raw.content)) {
    return { items: raw.content, totalItem: raw.totalElements ?? raw.content.length };
  }
  if (Array.isArray(raw)) return { items: raw, totalItem: raw.length };
  return fallbackPage;
};

const useAdminArticles = (initialChannel = 'news') => {
  const [channel, setChannel] = useState(initialChannel);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [paged, setPaged] = useState(fallbackPage);
  const [loading, setLoading] = useState(true);

  const loadArticles = useCallback(async () => {
    const url = ENDPOINT_BY_CHANNEL[channel];
    if (!url) return;
    setLoading(true);
    const params = { page, limit: rowsPerPage };
    if (search && search.trim() !== '') params.keyword = search.trim();
    const data = await safeFetch(
      () => apiClient.get(url, { params }),
      fallbackPage,
    );
    setPaged(normalizePage(data));
    setLoading(false);
  }, [channel, page, rowsPerPage, search]);

  useEffect(() => {
    const timer = setTimeout(loadArticles, 0);
    return () => clearTimeout(timer);
  }, [loadArticles]);

  return {
    channel,
    setChannel: (c) => { setChannel(c); setPage(0); },
    articles: paged?.items ?? [],
    totalItems: paged?.totalItem ?? 0,
    loading,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    search,
    setSearch,
    refresh: loadArticles,
  };
};

export default useAdminArticles;
