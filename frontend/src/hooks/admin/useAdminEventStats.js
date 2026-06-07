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
  totalEvents: 0,
  publishedEvents: 0,
  unpublishedEvents: 0,
  upcomingEvents: 0,
  ongoingEvents: 0,
  pastEvents: 0,
  newEventsToday: 0,
  totalTickets: 0,
  registeredTickets: 0,
  checkedInTickets: 0,
  cancelledTickets: 0,
  totalInterests: 0,
  topEventsByRegistration: [],
  topEventsByInterest: [],
};

const useAdminEventStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    fetchSafe(() => apiClient.get('/admin/events/statistics'), emptyStats).then((data) => {
      setStats(data || emptyStats);
      setLoading(false);
    });
  }, []);

  return { loading, stats };
};

export default useAdminEventStats;
