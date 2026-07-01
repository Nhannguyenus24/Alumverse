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
  byStartedYear: [],
  byGraduatedYear: [],
  byGraduationStatus: [],
  byGender: [],
  byAgeBucket: [],
  byVerificationLevel: [],
};

const useAdminCohortStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    fetchSafe(() => apiClient.get('/admin/dashboard/cohorts'), emptyStats).then((data) => {
      setStats(data || emptyStats);
      setLoading(false);
    });
  }, []);

  return { loading, stats };
};

export default useAdminCohortStats;
