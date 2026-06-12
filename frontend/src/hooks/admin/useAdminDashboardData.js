import { useCallback, useEffect, useState } from 'react';
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

const buildLoginTimeline = (dailyStats) => {
  const countByDate = new Map(
    (dailyStats || []).map((d) => [String(d.date ?? '').slice(0, 10), Number(d.count ?? 0)])
  );
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const key = toISODate(day);
    result.push({ date: fmtDateDDMM(key), count: countByDate.get(key) ?? 0 });
  }
  return result;
};

const fetchSafe = async (request, fallbackValue) => {
  try {
    const response = await request();
    const data = response?.data?.data ?? response?.data ?? null;
    return data ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const useAdminDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [timeline, setTimeline] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);

    const [metricsData, loginStats] = await Promise.all([
      fetchSafe(() => apiClient.get('/admin/dashboard/metrics'), emptyMetrics),
      fetchSafe(() => apiClient.get('/admin/audit/login-history/stats'), { dailyStats: [] }),
    ]);

    setMetrics(metricsData || emptyMetrics);
    setTimeline(buildLoginTimeline(loginStats?.dailyStats));
    
    setLoading(false);
  }, []);

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
