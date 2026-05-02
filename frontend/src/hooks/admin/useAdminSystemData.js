import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../utils/axios';
const emptyMetrics = {
  totalUsers: 0,
  bannedTodayCount: 0,
  pendingPosts: 0,
  auditLogsCount: 0,
  activeOrganizations: 0,
  newUsersThisWeek: 0,
};

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.items) return payload.items;
  if (payload?.content) return payload.content;
  if (payload?.data?.content) return payload.data.content;
  return [];
};

const mapLoginHistoryToAuditLog = (entry) => ({
  id: entry.id,
  timestamp: entry.loginAt,
  userId: entry.userId,
  userName: entry.userName,
  userEmail: entry.email,
  action: entry.loginMethod ?? 'LOGIN',
  entityType: 'USER',
  entityId: entry.userId,
  entityName: entry.userName ?? '',
  status: 'SUCCESS',
  description: `Login via ${entry.loginMethod ?? 'credentials'} from ${entry.loginIp ?? 'unknown IP'}`,
  ipAddress: entry.loginIp,
  userAgent: entry.userAgent,
  requestPath: null,
  executionTime: null,
  oldValue: null,
  newValue: null,
  errorMessage: null,
});

const fetchSafe = async (request, fallbackValue) => {
  try {
    const response = await request();
    const data = response?.data?.data ?? response?.data ?? null;
    return data ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const useAdminSystemData = () => {
  const [loading, setLoading] = useState(true);
  const [activeOrgId, setActiveOrgId] = useState(null);
  const [state, setState] = useState({
    metrics: emptyMetrics,
    timeline: [],
    users: [],
    organizations: [],
    auditLogs: [],
  });

  const loadData = useCallback(async () => {
    setLoading(true);

    const [metrics, timeline, users, organizations, rawAuditLogs] = await Promise.all([
      fetchSafe(() => apiClient.get('/admin/dashboard/metrics'), emptyMetrics),
      fetchSafe(() => apiClient.get('/admin/dashboard/activities'), []),
      fetchSafe(() => apiClient.get('/admin/users', { params: { page: 0, size: 20 } }), []),
      fetchSafe(() => apiClient.get('/admin/organizations', { params: { page: 0, size: 20 } }), []),
      fetchSafe(() => apiClient.get('/admin/audit/login-history', { params: { page: 0, size: 20 } }), null),
    ]);

    const normalizedUsers = normalizeList(users);
    const normalizedOrgs = normalizeList(organizations);
    const rawAuditList = normalizeList(rawAuditLogs);
    const auditLogs = rawAuditList.length > 0
      ? rawAuditList.map(mapLoginHistoryToAuditLog)
      : [];

    setState({
      metrics: metrics || emptyMetrics,
      timeline: Array.isArray(timeline) ? timeline : [],
      users: normalizedUsers,
      organizations: normalizedOrgs,
      auditLogs,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!activeOrgId && state.organizations.length > 0) {
      setActiveOrgId(state.organizations[0].id);
    }
  }, [activeOrgId, state.organizations]);

  const activeOrganization = useMemo(() => {
    return state.organizations.find((organization) => organization.id === activeOrgId) || null;
  }, [activeOrgId, state.organizations]);

  return {
    loading,
    activeOrgId,
    setActiveOrgId,
    activeOrganization,
    ...state,
  };
};

export default useAdminSystemData;
