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
  chat: {
    totalMessages: 0,
    totalGroups: 0,
    totalBlocks: 0,
    groupsByType: [],
    messagesByDay: [],
    requestsByStatus: [],
  },
  orgComparison: [],
  quality: {
    avgSessionRating: 0,
    ratingDistribution: [],
    mentorReportsByStatus: [],
    forumReportsByStatus: [],
  },
};

const useAdminPlatformStats = (from, to) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    fetchSafe(() => apiClient.get('/admin/dashboard/platform', { params }), emptyStats).then((data) => {
      setStats(data || emptyStats);
      setLoading(false);
    });
  }, [from, to]);

  return { loading, stats };
};

export default useAdminPlatformStats;
