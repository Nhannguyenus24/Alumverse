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

const emptyStats = {
  newUsersToday: 0,
  newUsersLast7Days: 0,
  newUsersLast30Days: 0,
  totalActiveUsers: 0,
  totalBannedUsers: 0,
  totalDeletedUsers: 0,
  dailyRegistrations: [],
};

const useAdminUserGrowthStats = (organizationId) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    const params = organizationId ? { organizationId } : {};
    fetchSafe(() => apiClient.get('/admin/users/growth-statistics', { params }), emptyStats).then((data) => {
      setStats(data || emptyStats);
      setLoading(false);
    });
  }, [organizationId]);

  return { loading, stats };
};

export default useAdminUserGrowthStats;
