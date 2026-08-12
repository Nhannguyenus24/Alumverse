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
  totalFunds: 0,
  activeFunds: 0,
  completedFunds: 0,
  totalTarget: 0,
  totalRaised: 0,
  totalDonations: 0,
  successfulDonations: 0,
  pendingDonations: 0,
  failedDonations: 0,
  successfulAmount: 0,
  topFundsByRaised: [],
  donationTimeline: [],
};

const useAdminFundraisingStats = (from, to) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    fetchSafe(() => apiClient.get('/admin/fundraising/statistics', { params }), emptyStats).then((data) => {
      setStats(data || emptyStats);
      setLoading(false);
    });
  }, [from, to]);

  return { loading, stats };
};

export default useAdminFundraisingStats;
