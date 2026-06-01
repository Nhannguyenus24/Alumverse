/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import * as api from '../../utils/api';

const fallbackPage = { items: [], totalItem: 0, totalPage: 0, currentPage: 0, pageSize: 10 };

const extractData = (response) => response?.data?.data ?? response?.data ?? null;

const safeFetch = async (request, fallback) => {
  try {
    const data = extractData(await request());
    return data ?? fallback;
  } catch {
    return fallback;
  }
};

const useAdminMentorship = () => {

  const [sessionPage, setSessionPage] = useState(0);
  const [sessionRowsPerPage, setSessionRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sessionPaged, setSessionPaged] = useState(fallbackPage);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [mentorPage, setMentorPage] = useState(0);
  const [mentorRowsPerPage, setMentorRowsPerPage] = useState(10);
  const [approvalFilter, setApprovalFilter] = useState('ALL');
  const [mentorPaged, setMentorPaged] = useState(fallbackPage);
  const [mentorLoading, setMentorLoading] = useState(true);

  const [statistics, setStatistics] = useState(null);

  const loadSessions = useCallback(async () => {
    setSessionLoading(true);
    const data = statusFilter === 'ALL'
      ? await safeFetch(() => api.getAllSessions(sessionPage, sessionRowsPerPage), fallbackPage)
      : await safeFetch(() => api.getSessionsByStatus(statusFilter, sessionPage, sessionRowsPerPage), fallbackPage);
    setSessionPaged(data || fallbackPage);
    setSessionLoading(false);
  }, [sessionPage, sessionRowsPerPage, statusFilter]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const loadMentors = useCallback(async () => {
    setMentorLoading(true);
    let data;
    if (approvalFilter === 'APPROVED') {
      data = await safeFetch(() => api.getMentorProfilesByApproval(true, mentorPage, mentorRowsPerPage), fallbackPage);
    } else if (approvalFilter === 'PENDING') {
      data = await safeFetch(() => api.getMentorProfilesByApproval(false, mentorPage, mentorRowsPerPage), fallbackPage);
    } else {
      data = await safeFetch(() => api.getAllMentorProfiles(mentorPage, mentorRowsPerPage), fallbackPage);
    }
    setMentorPaged(data || fallbackPage);
    setMentorLoading(false);
  }, [mentorPage, mentorRowsPerPage, approvalFilter]);

  useEffect(() => { loadMentors(); }, [loadMentors]);

  const loadStatistics = useCallback(async () => {
    const data = await safeFetch(() => api.getMentorshipStatistics(), null);
    setStatistics(data);
  }, []);

  useEffect(() => { loadStatistics(); }, [loadStatistics]);

  const updateSessionStatus = useCallback(async (sessionId, status) => {
    try {
      await api.updateSessionStatus(sessionId, status);
      await Promise.all([loadSessions(), loadStatistics()]);
      return true;
    } catch { return false; }
  }, [loadSessions, loadStatistics]);

  const deleteSession = useCallback(async (sessionId) => {
    try {
      await api.deleteSession(sessionId);
      await Promise.all([loadSessions(), loadStatistics()]);
      return true;
    } catch { return false; }
  }, [loadSessions, loadStatistics]);

  const approveMentor = useCallback(async (memberId) => {
    try {
      await api.approveMentor(memberId);
      await Promise.all([loadMentors(), loadStatistics()]);
      return true;
    } catch { return false; }
  }, [loadMentors, loadStatistics]);

  return {
    sessions: sessionPaged?.items ?? [],
    sessionTotal: sessionPaged?.totalItem ?? 0,
    sessionLoading,
    sessionPage, setSessionPage,
    sessionRowsPerPage, setSessionRowsPerPage,
    statusFilter, setStatusFilter,
    updateSessionStatus,
    deleteSession,

    mentors: mentorPaged?.items ?? [],
    mentorTotal: mentorPaged?.totalItem ?? 0,
    mentorLoading,
    mentorPage, setMentorPage,
    mentorRowsPerPage, setMentorRowsPerPage,
    approvalFilter, setApprovalFilter,
    approveMentor,

    statistics,
    refreshSessions: loadSessions,
    refreshMentors: loadMentors,
  };
};

export default useAdminMentorship;
