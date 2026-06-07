import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../utils/axios';
const emptyMetrics = {
  totalUsers: 0,
  bannedTodayCount: 0,
  pendingPosts: 0,
  auditLogsCount: 0,
  activeOrganizations: 0,
  newUsersThisWeek: 0,
  auditLogsCountToday: 0,
  pendingVerifications: 0,
  dailyActive: 0,
  totalDonationsCount: 0,
  donationsLast30Days: 0,
  totalEvents: 0,
  upcomingEvents: 0,
  ticketsSold: 0,
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

const normalizeActivitiesPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const fmtDateDDMM = (isoStr) => {
  const p = String(isoStr ?? '').slice(0, 10).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}` : isoStr;
};

const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const buildLoginTimeline = (dailyStats) => {
  const countByDate = new Map(
    (dailyStats || []).map((d) => [String(d.date ?? '').slice(0, 10), Number(d.count ?? 0)])
  );
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const key = toISODate(day);
    result.push({ date: fmtDateDDMM(key), count: countByDate.get(key) ?? 0 });
  }
  return result;
};

const mapActivityToAuditLog = (item, usersById) => {
  const actor = usersById.get(Number(item?.adminUserId));
  return {
    id: item.id,
    timestamp: item.timestamp,
    userId: item.adminUserId,
    userName: actor?.userName || `admin#${item.adminUserId ?? '-'}`,
    userEmail: actor?.email || '',
    action: item.action,
    entityType: item.resourceType,
    entityId: item.resourceId,
    entityName: item.resourceType && item.resourceId ? `${item.resourceType} #${item.resourceId}` : '',
    status: 'SUCCESS',
    description: item.metadata
      ? `${item.action || 'ACTION'} on ${item.resourceType || 'RESOURCE'} #${item.resourceId || '-'} (${item.metadata})`
      : `${item.action || 'ACTION'} on ${item.resourceType || 'RESOURCE'} #${item.resourceId || '-'}`,
    ipAddress: null,
    userAgent: null,
    requestPath: null,
    executionTime: null,
    oldValue: null,
    newValue: null,
    errorMessage: null,
  };
};

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

    const [metrics, activitiesPayload, users, organizations, rawLoginLogs, loginStats] = await Promise.all([
      fetchSafe(() => apiClient.get('/admin/dashboard/metrics'), emptyMetrics),
      fetchSafe(() => apiClient.get('/admin/dashboard/activities', { params: { page: 0, size: 200 } }), []),
      fetchSafe(() => apiClient.get('/admin/users', { params: { page: 0, size: 20 } }), []),
      fetchSafe(() => apiClient.get('/admin/organizations', { params: { page: 0, size: 20 } }), []),
      fetchSafe(() => apiClient.get('/admin/audit/login-history', { params: { page: 0, size: 20 } }), null),
      fetchSafe(() => apiClient.get('/admin/audit/login-history/stats'), { dailyStats: [] }),
    ]);

    const normalizedUsers = normalizeList(users);
    const normalizedOrgs = normalizeList(organizations);
    const usersById = new Map(normalizedUsers.map((u) => [Number(u.id), u]));
    const activities = normalizeActivitiesPayload(activitiesPayload);
    const loginRows = normalizeList(rawLoginLogs);

    const auditLogs = activities.length > 0
      ? activities.map((item) => mapActivityToAuditLog(item, usersById))
      : loginRows.map(mapLoginHistoryToAuditLog);
    const timeline = buildLoginTimeline(loginStats?.dailyStats);

    setState({
      metrics: metrics || emptyMetrics,
      timeline,
      users: normalizedUsers,
      organizations: normalizedOrgs,
      auditLogs,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    if (!activeOrgId && state.organizations.length > 0) {
      const timer = setTimeout(() => {
        setActiveOrgId(state.organizations[0].id);
      }, 0);
      return () => clearTimeout(timer);
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
    reload: loadData,
    ...state,
  };
};

export default useAdminSystemData;
