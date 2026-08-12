import { useCallback, useEffect, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import apiClient from '../../utils/axios';

const emptyMetrics = {
  totalUsers: 0,
  bannedTodayCount: 0,
  pendingPosts: 0,
  auditLogsCount: 0,
  activeOrganizations: 0,
  newUsersThisWeek: 0,
  auditLogsCountToday: 0,
  pendingVerifications: 0,
  dailyActive: 0,
  totalDonationsCount: 0,
  donationsLast30Days: 0,
  totalEvents: 0,
  upcomingEvents: 0,
  ticketsSold: 0,
};

const fmtDateDDMM = (isoStr) => {
  const p = String(isoStr ?? '').slice(0, 10).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}` : isoStr;
};

const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Build a per-day login timeline spanning the selected [from, to] window.
// Falls back to the last 7 days when no range is supplied.
const buildLoginTimeline = (dailyStats, from, to) => {
  const countByDate = new Map(
    (dailyStats || []).map((d) => [String(d.date ?? '').slice(0, 10), Number(d.count ?? 0)])
  );
  const result = [];
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  // Guard against an inverted/huge custom range producing an unbounded loop.
  let guard = 0;
  while (cursor <= endDay && guard < 400) {
    const key = toISODate(cursor);
    result.push({ date: fmtDateDDMM(key), count: countByDate.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return result;
};

let lastLoadErrorToastAt = 0;

const notifyDataLoadError = () => {
  const now = Date.now();
  if (now - lastLoadErrorToastAt < 5000) return;
  lastLoadErrorToastAt = now;
  enqueueSnackbar('Không tải được dữ liệu tổng quan. Vui lòng thử lại.', { variant: 'error' });
};

const fetchSafe = async (request, fallbackValue) => {
  try {
    const response = await request();
    const data = response?.data?.data ?? response?.data ?? null;
    return data ?? fallbackValue;
  } catch {
    notifyDataLoadError();
    return fallbackValue;
  }
};

const useAdminDashboardData = (from, to) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [timeline, setTimeline] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);

    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const [metricsData, loginStats] = await Promise.all([
      fetchSafe(() => apiClient.get('/admin/dashboard/metrics', { params }), emptyMetrics),
      fetchSafe(() => apiClient.get('/admin/audit/login-history/stats', { params }), { dailyStats: [] }),
    ]);

    setMetrics(metricsData || emptyMetrics);
    setTimeline(buildLoginTimeline(loginStats?.dailyStats, from, to));

    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  return {
    loading,
    metrics,
    timeline,
    reload: loadData,
  };
};

export default useAdminDashboardData;
