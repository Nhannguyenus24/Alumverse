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
  totalNews: 0,
  totalAlumniPosts: 0,
  totalJobs: 0,
  activeJobs: 0,
  totalLearningResources: 0,
  totalAchievements: 0,
  newContentThisWeek: 0,
  newContentThisMonth: 0,
};

const useAdminContentStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    fetchSafe(() => apiClient.get('/admin/articles/statistics'), emptyStats).then((data) => {
      setStats(data || emptyStats);
      setLoading(false);
    });
  }, []);

  return { loading, stats };
};

export default useAdminContentStats;
