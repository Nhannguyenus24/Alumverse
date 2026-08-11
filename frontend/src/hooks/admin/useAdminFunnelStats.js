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
  verification: [],
  event: [],
  donation: [],
  mentorApproval: [],
  mentorshipSession: [],
  verificationRate: 0,
  eventCheckinRate: 0,
  eventCapacityFillRate: 0,
  donationSuccessRate: 0,
  mentorApprovalRate: 0,
  sessionCompletionRate: 0,
};

const useAdminFunnelStats = (from, to) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    fetchSafe(() => apiClient.get('/admin/dashboard/funnels', { params }), emptyStats).then((data) => {
      setStats(data || emptyStats);
      setLoading(false);
    });
  }, [from, to]);

  return { loading, stats };
};

export default useAdminFunnelStats;
