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

const useAdminMentorship = (organizationId = null) => {

  const [sessionPage, setSessionPage] = useState(0);
  const [sessionRowsPerPage, setSessionRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sessionPaged, setSessionPaged] = useState(fallbackPage);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [mentorPage, setMentorPage] = useState(0);
  const [mentorRowsPerPage, setMentorRowsPerPage] = useState(10);
  // Trang mở ở tab "Cần duyệt" nên mặc định lọc PENDING; tab "DS Mentor" sẽ đổi sang ALL.
  const [approvalFilter, setApprovalFilter] = useState('PENDING');
  const [mentorPaged, setMentorPaged] = useState(fallbackPage);
  const [mentorCounts, setMentorCounts] = useState({ all: 0, pending: 0 });
  const [mentorLoading, setMentorLoading] = useState(true);

  const [menteePage, setMenteePage] = useState(0);
  const [menteeRowsPerPage, setMenteeRowsPerPage] = useState(10);
  const [menteePaged, setMenteePaged] = useState(fallbackPage);
  const [menteeLoading, setMenteeLoading] = useState(true);

  const [reportPage, setReportPage] = useState(0);
  const [reportRowsPerPage, setReportRowsPerPage] = useState(10);
  const [reportStatusFilter, setReportStatusFilter] = useState('PENDING');
  const [reportPaged, setReportPaged] = useState(fallbackPage);
  const [reportLoading, setReportLoading] = useState(true);

  const [statistics, setStatistics] = useState(null);

  const loadSessions = useCallback(async () => {
    setSessionLoading(true);
    const orgId = organizationId || null;
    const data = statusFilter === 'ALL'
      ? await safeFetch(() => api.getAllSessions({ page: sessionPage, size: sessionRowsPerPage, ...(orgId ? { organizationId: orgId } : {}) }), fallbackPage)
      : await safeFetch(() => api.getSessionsByStatus(statusFilter, sessionPage, sessionRowsPerPage, orgId), fallbackPage);
    setSessionPaged(data || fallbackPage);
    setSessionLoading(false);
  }, [sessionPage, sessionRowsPerPage, statusFilter, organizationId]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const loadMentors = useCallback(async () => {
    setMentorLoading(true);
    const orgId = organizationId || null;
    let data;
    if (approvalFilter === 'APPROVED') {
      data = await safeFetch(() => api.getMentorProfilesByStatus('APPROVED', mentorPage, mentorRowsPerPage, orgId), fallbackPage);
    } else if (approvalFilter === 'PENDING') {
      data = await safeFetch(() => api.getMentorProfilesByStatus('PENDING', mentorPage, mentorRowsPerPage, orgId), fallbackPage);
    } else {
      data = await safeFetch(() => api.getAllMentorProfiles(mentorPage, mentorRowsPerPage, orgId), fallbackPage);
    }
    setMentorPaged(data || fallbackPage);
    setMentorLoading(false);
  }, [mentorPage, mentorRowsPerPage, approvalFilter, organizationId]);

  useEffect(() => { loadMentors(); }, [loadMentors]);

  const loadMentorCounts = useCallback(async () => {
    const orgId = organizationId || null;
    const [allData, pendingData] = await Promise.all([
      safeFetch(() => api.getAllMentorProfiles(0, 1, orgId), fallbackPage),
      safeFetch(() => api.getMentorProfilesByStatus('PENDING', 0, 1, orgId), fallbackPage),
    ]);
    setMentorCounts({
      all: allData?.totalItem ?? 0,
      pending: pendingData?.totalItem ?? 0,
    });
  }, [organizationId]);

  useEffect(() => { loadMentorCounts(); }, [loadMentorCounts]);

  const loadMentees = useCallback(async () => {
    setMenteeLoading(true);
    const orgId = organizationId || null;
    const data = await safeFetch(() => api.getMentees(menteePage, menteeRowsPerPage, orgId), fallbackPage);
    setMenteePaged(data || fallbackPage);
    setMenteeLoading(false);
  }, [menteePage, menteeRowsPerPage, organizationId]);

  useEffect(() => { loadMentees(); }, [loadMentees]);

  const loadReports = useCallback(async () => {
    setReportLoading(true);
    const orgId = organizationId || null;
    const data = await safeFetch(() => api.getMentorReports(reportStatusFilter, reportPage, reportRowsPerPage, orgId), fallbackPage);
    setReportPaged(data || fallbackPage);
    setReportLoading(false);
  }, [reportStatusFilter, reportPage, reportRowsPerPage, organizationId]);

  useEffect(() => { loadReports(); }, [loadReports]);

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
    await api.approveMentor(memberId, organizationId || null);
    await Promise.all([loadMentors(), loadMentorCounts(), loadStatistics()]);
    return true;
  }, [loadMentors, loadMentorCounts, loadStatistics, organizationId]);

  const rejectMentor = useCallback(async (memberId, reason) => {
    await api.rejectMentor(memberId, reason, organizationId || null);
    await Promise.all([loadMentors(), loadMentorCounts(), loadStatistics()]);
    return true;
  }, [loadMentors, loadMentorCounts, loadStatistics, organizationId]);

  const requestMentorUpdate = useCallback(async (memberId, reason) => {
    await api.requestMentorUpdate(memberId, reason, organizationId || null);
    await Promise.all([loadMentors(), loadMentorCounts(), loadStatistics()]);
    return true;
  }, [loadMentors, loadMentorCounts, loadStatistics, organizationId]);

  const resolveReport = useCallback(async (reportId, action, resolutionNote) => {
    try {
      await api.resolveMentorReport(reportId, action, resolutionNote);
      await Promise.all([loadReports(), loadMentees()]);
      return true;
    } catch { return false; }
  }, [loadReports, loadMentees]);

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
    mentorCounts,
    mentorLoading,
    mentorPage, setMentorPage,
    mentorRowsPerPage, setMentorRowsPerPage,
    approvalFilter, setApprovalFilter,
    approveMentor,
    rejectMentor,
    requestMentorUpdate,

    mentees: menteePaged?.items ?? [],
    menteeTotal: menteePaged?.totalItem ?? 0,
    menteeLoading,
    menteePage, setMenteePage,
    menteeRowsPerPage, setMenteeRowsPerPage,

    reports: reportPaged?.items ?? [],
    reportTotal: reportPaged?.totalItem ?? 0,
    reportLoading,
    reportPage, setReportPage,
    reportRowsPerPage, setReportRowsPerPage,
    reportStatusFilter, setReportStatusFilter,
    resolveReport,

    statistics,
    refreshSessions: loadSessions,
    refreshMentors: loadMentors,
    refreshMentees: loadMentees,
    refreshReports: loadReports,
  };
};

export default useAdminMentorship;
