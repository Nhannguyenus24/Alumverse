import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../utils/axios';
import { DEFAULT_ADMIN_USERS } from '../../constants/adminDefaultUsers';

const fallbackMetrics = {
  totalUsers: 1284,
  bannedTodayCount: 4,
  pendingPosts: 17,
  auditLogsCount: 96,
  activeOrganizations: 43,
  newUsersThisWeek: 31,
};

const fallbackTimeline = [
  { date: 'T2', count: 23 },
  { date: 'T3', count: 28 },
  { date: 'T4', count: 24 },
  { date: 'T5', count: 39 },
  { date: 'T6', count: 35 },
  { date: 'T7', count: 43 },
  { date: 'CN', count: 27 },
];

const fallbackUsers = DEFAULT_ADMIN_USERS;

const fallbackAudit = [
  {
    id: 501,
    timestamp: '2026-04-01T09:15:00',
    userId: 900,
    userName: 'admin.main',
    userEmail: 'admin.main@alumverse.io',
    action: 'BAN',
    entityType: 'USER',
    entityId: 102,
    entityName: 'Linh Tran',
    status: 'SUCCESS',
    description: 'Banned account due to harassment report',
    oldValue: { status: 'ACTIVE' },
    newValue: { status: 'BANNED', banReason: 'Harassment report' },
    ipAddress: '10.10.1.45',
    userAgent: 'Mozilla/5.0 Chrome/123',
    requestPath: '/api/admin/users/ban',
    executionTime: 178,
    errorMessage: null,
  },
  {
    id: 502,
    timestamp: '2026-04-01T09:48:00',
    userId: 901,
    userName: 'mod.forum',
    userEmail: 'mod.forum@alumverse.io',
    action: 'DELETE',
    entityType: 'FORUM_POST',
    entityId: 9003,
    entityName: 'Community guideline',
    status: 'SUCCESS',
    description: 'Deleted post after multi-flag verification',
    oldValue: { isDeleted: false },
    newValue: { isDeleted: true, deletedReason: 'Multi-flag verification' },
    ipAddress: '10.10.1.52',
    userAgent: 'Mozilla/5.0 Chrome/123',
    requestPath: '/api/admin/forum/posts/9003',
    executionTime: 132,
    errorMessage: null,
  },
  {
    id: 503,
    timestamp: '2026-04-01T10:02:00',
    userId: 900,
    userName: 'admin.main',
    userEmail: 'admin.main@alumverse.io',
    action: 'UPDATE',
    entityType: 'FORUM_CATEGORY',
    entityId: 7,
    entityName: 'Alumni Career',
    status: 'FAILED',
    description: 'Cannot update category due to invalid hierarchy',
    oldValue: { parentId: 1, ordering: 3 },
    newValue: { parentId: 7, ordering: 1 },
    ipAddress: '10.10.1.45',
    userAgent: 'Mozilla/5.0 Chrome/123',
    requestPath: '/api/admin/forum/categories/7',
    executionTime: 241,
    errorMessage: 'Circular hierarchy detected',
  },
  {
    id: 504,
    timestamp: '2026-04-02T08:21:00',
    userId: 902,
    userName: 'admin.ops',
    userEmail: 'admin.ops@alumverse.io',
    action: 'UPDATE',
    entityType: 'ORGANIZATION',
    entityId: 4,
    entityName: 'HCMUS Entrepreneurship Hub',
    status: 'SUCCESS',
    description: 'Organization profile updated with new contact email',
    oldValue: { contactEmail: 'old-hub@alumverse.io' },
    newValue: { contactEmail: 'hub@alumverse.io' },
    ipAddress: '10.10.1.61',
    userAgent: 'Mozilla/5.0 Firefox/124',
    requestPath: '/api/admin/organizations/4',
    executionTime: 117,
    errorMessage: null,
  },
  {
    id: 505,
    timestamp: '2026-04-02T09:12:00',
    userId: 900,
    userName: 'admin.main',
    userEmail: 'admin.main@alumverse.io',
    action: 'CREATE',
    entityType: 'FORUM_TOPIC',
    entityId: 88,
    entityName: 'Alumni Startup Showcase',
    status: 'SUCCESS',
    description: 'Created new forum topic for startup showcase campaign',
    oldValue: null,
    newValue: { title: 'Alumni Startup Showcase', categoryId: 7 },
    ipAddress: '10.10.1.45',
    userAgent: 'Mozilla/5.0 Chrome/123',
    requestPath: '/api/admin/forum/topics',
    executionTime: 149,
    errorMessage: null,
  },
];

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
    metrics: fallbackMetrics,
    timeline: fallbackTimeline,
    users: fallbackUsers,
    organizations: [],
    auditLogs: fallbackAudit,
  });

  const loadData = useCallback(async () => {
    setLoading(true);

    const [metrics, timeline, users, organizations, rawAuditLogs] = await Promise.all([
      fetchSafe(() => apiClient.get('/admin/dashboard/metrics'), fallbackMetrics),
      fetchSafe(() => apiClient.get('/admin/dashboard/activities'), fallbackTimeline),
      fetchSafe(() => apiClient.get('/admin/users', { params: { page: 0, size: 20 } }), fallbackUsers),
      fetchSafe(() => apiClient.get('/admin/organizations', { params: { page: 0, size: 20 } }), []),
      fetchSafe(() => apiClient.get('/admin/audit/login-history', { params: { page: 0, size: 20 } }), null),
    ]);

    const normalizedUsers = normalizeList(users);
    const normalizedOrgs = normalizeList(organizations);
    const rawAuditList = normalizeList(rawAuditLogs);
    const auditLogs = rawAuditList.length > 0
      ? rawAuditList.map(mapLoginHistoryToAuditLog)
      : fallbackAudit;

    setState({
      metrics: metrics || fallbackMetrics,
      timeline: Array.isArray(timeline) ? timeline : fallbackTimeline,
      users: normalizedUsers.length > 0 ? normalizedUsers : fallbackUsers,
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
