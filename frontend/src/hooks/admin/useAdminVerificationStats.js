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
  totalAlumniVerificationRequests: 0,
  pendingAlumniRequests: 0,
  approvedAlumniRequests: 0,
  rejectedAlumniRequests: 0,
  needsRevisionRequests: 0,
  totalPeerVerifications: 0,
  pendingPeerVerifications: 0,
  approvedPeerVerifications: 0,
};

const useAdminVerificationStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    fetchSafe(() => apiClient.get('/admin/users/verification-statistics'), emptyStats).then((data) => {
      setStats(data || emptyStats);
      setLoading(false);
    });
  }, []);

  return { loading, stats };
};

export default useAdminVerificationStats;
