import { useCallback, useEffect, useState } from 'react';
import apiClient from '../../utils/axios';

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
  studentId: null,
  userEmail: entry.email,
  action: entry.loginMethod ?? 'LOGIN',
  entityType: 'USER',
  entityId: entry.userId,
  entityName: entry.email ?? '',
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

const fallbackActorLabel = (id) => (id ? `Quản trị viên #${id}` : 'Quản trị viên');

const mapActivityToAuditLog = (item, usersById) => {
  const actor = usersById.get(Number(item?.adminUserId));
  const actorName = item?.adminFullName || actor?.fullName || actor?.name || fallbackActorLabel(item?.adminUserId);
  const actorEmail = item?.adminEmail || actor?.email || '';
  const resourceType = item.resourceType || 'RESOURCE';
  const resourceId = item.resourceId || '-';
  const action = item.action || 'ACTION';

  return {
    id: item.id,
    timestamp: item.timestamp,
    userId: item.adminUserId,
    actorName,
    studentId: actor?.studentId || actorName,
    userEmail: actorEmail,
    action,
    entityType: resourceType,
    entityId: resourceId,
    entityName: resourceType && resourceId ? `${resourceType} #${resourceId}` : '',
    status: 'SUCCESS',
    description: item.metadata
      ? `${action} on ${resourceType} #${resourceId} (${item.metadata})`
      : `${action} on ${resourceType} #${resourceId}`,
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

const useAdminAuditLogsData = () => {
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);

    const [activitiesPayload, users, rawLoginLogs] = await Promise.all([
      fetchSafe(() => apiClient.get('/admin/dashboard/activities', { params: { page: 0, size: 200 } }), []),
      fetchSafe(() => apiClient.get('/admin/users', { params: { page: 0, size: 500 } }), []),
      fetchSafe(() => apiClient.get('/admin/audit/login-history', { params: { page: 0, size: 20 } }), null),
    ]);

    const normalizedUsers = normalizeList(users);
    const usersById = new Map(normalizedUsers.map((u) => [Number(u.id), u]));
    const activities = normalizeActivitiesPayload(activitiesPayload);
    const loginRows = normalizeList(rawLoginLogs);

    const logs = activities.length > 0
      ? activities.map((item) => mapActivityToAuditLog(item, usersById))
      : loginRows.map(mapLoginHistoryToAuditLog);

    setAuditLogs(logs);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  return {
    loading,
    auditLogs,
    reload: loadData,
  };
};

export default useAdminAuditLogsData;
