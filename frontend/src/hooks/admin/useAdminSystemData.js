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

const normalizeActivitiesPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const buildTimelineFromActivities = (items) => {
  const byDay = new Map();
  items.forEach((item) => {
    const ts = item?.timestamp || item?.createdAt;
    if (!ts) return;
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    byDay.set(key, (byDay.get(key) || 0) + 1);
  });
  return Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
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

    const [metrics, activitiesPayload, users, organizations, rawLoginLogs] = await Promise.all([
      fetchSafe(() => apiClient.get('/admin/dashboard/metrics'), emptyMetrics),
      fetchSafe(() => apiClient.get('/admin/dashboard/activities', { params: { page: 0, size: 200 } }), []),
      fetchSafe(() => apiClient.get('/admin/users', { params: { page: 0, size: 20 } }), []),
      fetchSafe(() => apiClient.get('/admin/organizations', { params: { page: 0, size: 20 } }), []),
      fetchSafe(() => apiClient.get('/admin/audit/login-history', { params: { page: 0, size: 20 } }), null),
    ]);

    const normalizedUsers = normalizeList(users);
    const normalizedOrgs = normalizeList(organizations);
    const usersById = new Map(normalizedUsers.map((u) => [Number(u.id), u]));
    const activities = normalizeActivitiesPayload(activitiesPayload);
    const loginRows = normalizeList(rawLoginLogs);

    const auditLogs = activities.length > 0
      ? activities.map((item) => mapActivityToAuditLog(item, usersById))
      : loginRows.map(mapLoginHistoryToAuditLog);
    const timeline = buildTimelineFromActivities(activities);

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
    ...state,
  };
};

export default useAdminSystemData;
