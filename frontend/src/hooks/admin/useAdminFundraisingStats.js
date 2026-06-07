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

const useAdminFundraisingStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    fetchSafe(() => apiClient.get('/admin/fundraising/statistics'), emptyStats).then((data) => {
      setStats(data || emptyStats);
      setLoading(false);
    });
  }, []);

  return { loading, stats };
};

export default useAdminFundraisingStats;
