import { useEffect, useState } from 'react';
import apiClient from '../../utils/axios';

const fetchSafe = async (request, fallback) => {
  try {
    const res = await request();
    return res?.data?.data ?? res?.data ?? fallback;
  } catch {
    return fallback;
  }
};

const useAdminSecurityStats = (from, to) => {
  const [loading, setLoading] = useState(true);
  const [loginStats, setLoginStats] = useState({ methodStats: [], dailyStats: [] });
  const [suspiciousLogins, setSuspiciousLogins] = useState([]);

  useEffect(() => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    Promise.all([
      // Suspicious-login detection keeps its own fixed 7-day window (server-side).
      fetchSafe(() => apiClient.get('/admin/audit/login-history/stats', { params }), { methodStats: [], dailyStats: [] }),
      fetchSafe(() => apiClient.get('/admin/audit/login-history/suspicious'), []),
    ]).then(([stats, suspicious]) => {
      setLoginStats(stats || { methodStats: [], dailyStats: [] });
      setSuspiciousLogins(Array.isArray(suspicious) ? suspicious : []);
      setLoading(false);
    });
  }, [from, to]);

  return { loading, loginStats, suspiciousLogins };
};

export default useAdminSecurityStats;
