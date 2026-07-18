import { useCallback, useEffect, useState } from 'react';
import apiClient from '../../utils/axios';

const ENDPOINT_BY_CHANNEL = {
  news: '/admin/articles/news',
  alumni: '/admin/articles/alumni-posts',
  achievement: '/admin/articles/achievements',
  job: '/admin/articles/jobs',
  learning: '/admin/articles/learning-resources',
};

const fallbackPage = { items: [], totalItem: 0, totalPage: 0, currentPage: 0, pageSize: 10 };
const ALL_CHANNELS = Object.keys(ENDPOINT_BY_CHANNEL);
const ALL_CHANNEL_FETCH_LIMIT = 1000;

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

const withChannel = (items, channel) =>
  (items ?? []).map((item) => ({ ...item, channel }));

const createdOf = (item) =>
  item?.createdAt
  || item?.created_at
  || null;

const timestampOf = (item) => {
  const raw = createdOf(item);
  if (!raw) return 0;
  const timestamp = new Date(raw).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortByCreated = (items, order = 'DESC') => {
  const dir = order === 'ASC' ? 1 : -1;
  return [...items].sort((a, b) => {
    const at = timestampOf(a);
    const bt = timestampOf(b);
    if (at !== bt) return (at - bt) * dir;

    const aid = Number(a?.id) || 0;
    const bid = Number(b?.id) || 0;
    return (aid - bid) * dir;
  });
};

const useAdminArticles = (initialChannel = 'all', organizationId = null) => {
  const [channel, setChannel] = useState(initialChannel);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrderState] = useState('DESC');
  const [paged, setPaged] = useState(fallbackPage);
  const [loading, setLoading] = useState(true);

  const loadArticles = useCallback(async () => {
    setLoading(true);

    if (channel === 'all') {
      const baseParams = { page: 0, limit: ALL_CHANNEL_FETCH_LIMIT };
      if (search && search.trim() !== '') baseParams.keyword = search.trim();
      if (organizationId) baseParams.organizationId = organizationId;

      const pages = await Promise.all(
        ALL_CHANNELS.map(async (itemChannel) => {
          const raw = await safeFetch(
            () => apiClient.get(ENDPOINT_BY_CHANNEL[itemChannel], { params: baseParams }),
            fallbackPage,
          );
          return withChannel(normalizePage(raw).items, itemChannel);
        }),
      );
      const merged = sortByCreated(pages.flat(), sortOrder);
      const start = page * rowsPerPage;
      setPaged({
        items: merged.slice(start, start + rowsPerPage),
        totalItem: merged.length,
        totalPage: Math.ceil(merged.length / rowsPerPage),
        currentPage: page,
        pageSize: rowsPerPage,
      });
      setLoading(false);
      return;
    }

    const url = ENDPOINT_BY_CHANNEL[channel];
    if (!url) {
      setPaged(fallbackPage);
      setLoading(false);
      return;
    }

    const params = { page, limit: rowsPerPage };
    if (search && search.trim() !== '') params.keyword = search.trim();
    if (organizationId) params.organizationId = organizationId;
    const data = await safeFetch(() => apiClient.get(url, { params }), fallbackPage);
    const normalized = normalizePage(data);
    setPaged({
      ...normalized,
      items: sortByCreated(withChannel(normalized.items, channel), sortOrder),
    });
    setLoading(false);
  }, [channel, page, rowsPerPage, search, organizationId, sortOrder]);

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
    sortOrder,
    setSortOrder: (order) => { setSortOrderState(order); setPage(0); },
    refresh: loadArticles,
  };
};

export default useAdminArticles;
