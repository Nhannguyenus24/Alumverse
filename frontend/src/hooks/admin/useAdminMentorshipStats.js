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
  totalSessions: 0,
  pendingSessions: 0,
  confirmedSessions: 0,
  completedSessions: 0,
  cancelledSessions: 0,
  rejectedSessions: 0,
  totalMentors: 0,
  approvedMentors: 0,
  pendingMentors: 0,
  totalAvailabilities: 0,
  totalFeedbacks: 0,
};

const useAdminMentorshipStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    fetchSafe(() => apiClient.get('/admin/mentorship/statistics'), emptyStats).then((data) => {
      setStats(data || emptyStats);
      setLoading(false);
    });
  }, []);

  return { loading, stats };
};

export default useAdminMentorshipStats;
