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

const useAdminSecurityStats = () => {
  const [loading, setLoading] = useState(true);
  const [loginStats, setLoginStats] = useState({ methodStats: [], dailyStats: [] });
  const [suspiciousLogins, setSuspiciousLogins] = useState([]);

  useEffect(() => {
    Promise.all([
      fetchSafe(() => apiClient.get('/admin/audit/login-history/stats'), { methodStats: [], dailyStats: [] }),
      fetchSafe(() => apiClient.get('/admin/audit/login-history/suspicious'), []),
    ]).then(([stats, suspicious]) => {
      setLoginStats(stats || { methodStats: [], dailyStats: [] });
      setSuspiciousLogins(Array.isArray(suspicious) ? suspicious : []);
      setLoading(false);
    });
  }, []);

  return { loading, loginStats, suspiciousLogins };
};

export default useAdminSecurityStats;
