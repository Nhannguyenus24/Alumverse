import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../utils/axios';

// Pull the payload out of the various envelope shapes the API may return.
const unwrap = (response) => response?.data?.data ?? response?.data ?? null;

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const parseMaybeJson = (value) => {
  if (value == null || value === '') return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const fallbackActorLabel = (id) => (id ? `Quản trị viên #${id}` : 'Quản trị viên');

// Map an AdminAuditLogResponse row onto the shape the audit table + expandable row expect.
const mapAuditLog = (item) => {
  const actorName = item.adminFullName || fallbackActorLabel(item.adminUserId);
  const httpMethod = item.httpMethod || '';
  const requestPath = item.requestPath || '';
  return {
    id: item.id,
    timestamp: item.createdAt,
    userId: item.adminUserId,
    actorName,
    studentId: actorName,
    userEmail: item.adminEmail || '',
    adminRole: item.adminRole || '',
    action: item.action || 'ACTION',
    entityType: item.resourceType || 'RESOURCE',
    entityId: item.resourceId || '-',
    entityName: item.resourceType && item.resourceId ? `${item.resourceType} #${item.resourceId}` : '',
    targetUserId: item.targetUserId ?? null,
    status: item.status || (item.statusCode != null && item.statusCode >= 400 ? 'FAILURE' : 'SUCCESS'),
    statusCode: item.statusCode ?? null,
    httpMethod,
    metadata: parseMaybeJson(item.metadata),
    ipAddress: item.ipAddress || null,
    requestPath: requestPath ? `${httpMethod} ${requestPath}`.trim() : null,
    userAgent: item.userAgent || null,
    executionTime: item.latencyMs ?? null,
    oldValue: parseMaybeJson(item.beforeData),
    newValue: parseMaybeJson(item.afterData),
  };
};

// Convert a yyyy-mm-dd date input into an ISO date-time the backend's @DateTimeFormat accepts.
const toIsoStart = (date) => (date ? `${date}T00:00:00` : undefined);
const toIsoEnd = (date) => (date ? `${date}T23:59:59` : undefined);

const buildParams = (filters) => {
  const params = {
    page: filters.page ?? 0,
    size: filters.size ?? 25,
  };
  if (filters.q?.trim()) params.q = filters.q.trim();
  if (filters.adminUserId) params.adminUserId = filters.adminUserId;
  if (filters.action) params.action = filters.action;
  if (filters.resourceType) params.resourceType = filters.resourceType;
  if (filters.status) params.status = filters.status;
  const from = toIsoStart(filters.from);
  const to = toIsoEnd(filters.to);
  if (from) params.from = from;
  if (to) params.to = to;
  return params;
};

/**
 * Server-driven data source for the admin audit log. Filtering, pagination and export all
 * happen on the backend so the view reflects the full history, not just a scraped page.
 */
const useAdminAuditLogsData = (filters) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState({ actions: [], resourceTypes: [], admins: [] });
  const [summary, setSummary] = useState([]);

  const searchParams = useMemo(() => buildParams(filters || {}), [filters]);
  const searchKey = useMemo(() => JSON.stringify(searchParams), [searchParams]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/audit/actions', { params: searchParams });
      const payload = unwrap(response);
      const list = asList(payload);
      setRows(list.map(mapAuditLog));
      setTotal(payload?.totalElements ?? payload?.total ?? payload?.totalCount ?? list.length);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const loadFacetsAndSummary = useCallback(async () => {
    try {
      const [facetsRes, summaryRes] = await Promise.all([
        apiClient.get('/admin/audit/actions/facets'),
        apiClient.get('/admin/audit/actions/summary'),
      ]);
      const facetsPayload = unwrap(facetsRes) || {};
      setFacets({
        actions: facetsPayload.actions || [],
        resourceTypes: facetsPayload.resourceTypes || [],
        admins: facetsPayload.admins || [],
      });
      setSummary(asList(unwrap(summaryRes)));
    } catch {
      /* facets/summary are enhancements; failing them must not blank the table */
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadPage, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  useEffect(() => {
    loadFacetsAndSummary();
  }, [loadFacetsAndSummary]);

  // Trigger a server-side CSV export honoring the current filters (no pagination).
  const exportCsv = useCallback(async () => {
    const { page: _page, size: _size, ...exportFilters } = searchParams;
    const response = await apiClient.get('/admin/audit/actions/export', {
      params: exportFilters,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [searchParams]);

  return {
    loading,
    rows,
    // Backward-compatible alias: AdminUserDetailPage consumes `auditLogs` as a fallback
    // list it filters by entityType/entityId.
    auditLogs: rows,
    total,
    facets,
    summary,
    reload: loadPage,
    exportCsv,
  };
};

export default useAdminAuditLogsData;
