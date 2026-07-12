import { useMemo, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import {
  alpha,
  useTheme,
} from '@mui/material';
import useAdminAuditLogsData from '../../hooks/admin/useAdminAuditLogsData';
import { formatDateTimeWithSeconds } from '../../utils/dateFormatter';
import { stringifyJson } from '../../utils/stringUtils';

const DEFAULT_ENTITY_TYPES = [
  'USER',
  'FORUM_POST',
  'FORUM_TOPIC',
  'FORUM_CATEGORY',
  'ORGANIZATION',
  'EVENT',
  'ORGANIZATION_MEMBER',
];

const DEFAULT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'BAN', 'UNBAN', 'APPROVE', 'REJECT'];

const AUDIT_ACTION_LABEL_KEYS = {
  CREATE: 'audit_action_create',
  UPDATE: 'audit_action_update',
  DELETE: 'audit_action_delete',
  BAN: 'audit_action_ban',
  UNBAN: 'audit_action_unban',
  APPROVE: 'audit_action_approve',
  REJECT: 'audit_action_reject',
  RESET_PASSWORD: 'audit_action_reset_password',
  UPDATE_TOPIC_LOCK: 'audit_action_update_topic_lock',
  UPDATE_POST_VISIBILITY: 'audit_action_update_post_visibility',
  UPDATE_CATEGORY_STATUS: 'audit_action_update_category_status',
  UPDATE_TOPIC_STATUS: 'audit_action_update_topic_status',
  BAN_POST: 'audit_action_ban_post',
  UNBAN_POST: 'audit_action_unban_post',
  WARN_USER: 'audit_action_warn_user',
  LOGIN: 'audit_action_login',
};

const AUDIT_ENTITY_LABEL_KEYS = {
  USER: 'audit_entity_user',
  FORUM_POST: 'audit_entity_forum_post',
  FORUM_TOPIC: 'audit_entity_forum_topic',
  FORUM_CATEGORY: 'audit_entity_forum_category',
  ORGANIZATION: 'audit_entity_organization',
  EVENT: 'audit_entity_event',
  ORGANIZATION_MEMBER: 'audit_entity_organization_member',
  FORUM_REPORT: 'audit_entity_forum_report',
};

const formatEnumFallback = (raw) =>
  String(raw || '—')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatAuditLabel = (t, map, raw) => {
  const key = String(raw || '').toUpperCase();
  const i18nKey = map[key];
  return i18nKey ? t(i18nKey, { defaultValue: formatEnumFallback(raw) }) : formatEnumFallback(raw);
};

const parseMaybeJson = (value) => {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const extractDescriptionMetadata = (description) => {
  const match = String(description || '').match(/\((.*)\)$/);
  return match ? parseMaybeJson(match[1]) : null;
};

const METADATA_LABEL_KEYS = {
  reason: 'audit_meta_reason',
  source: 'audit_meta_source',
  reportId: 'audit_meta_report_id',
  adminUserId: 'audit_meta_admin_user_id',
  hidden: 'audit_meta_hidden',
  status: 'audit_meta_status',
};

const formatMetadataKey = (t, key) => {
  const i18nKey = METADATA_LABEL_KEYS[key];
  if (i18nKey) return t(i18nKey, { defaultValue: formatEnumFallback(key) });
  return String(key || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
};

const formatMetadataValue = (t, value) => {
  const parsed = parseMaybeJson(value);
  if (parsed == null || parsed === '') return '—';
  if (Array.isArray(parsed)) return parsed.map((item) => formatMetadataValue(t, item)).join(', ');
  if (typeof parsed === 'object') {
    return Object.entries(parsed)
      .filter(([, entryValue]) => entryValue != null && entryValue !== '')
      .map(([entryKey, entryValue]) => `${formatMetadataKey(t, entryKey)}: ${formatMetadataValue(t, entryValue)}`)
      .join('; ');
  }
  if (typeof parsed === 'boolean') return parsed ? t('yes', { defaultValue: 'Có' }) : t('no', { defaultValue: 'Không' });
  return String(parsed).replace(/^["']|["']$/g, '');
};

const formatAuditMetadata = (t, metadata) => {
  const parsed = parseMaybeJson(metadata);
  if (parsed == null || parsed === '') return '';
  return formatMetadataValue(t, parsed);
};

const formatAuditDescription = (t, log) => {
  const action = formatAuditLabel(t, AUDIT_ACTION_LABEL_KEYS, log.action);
  const entity = formatAuditLabel(t, AUDIT_ENTITY_LABEL_KEYS, log.entityType);
  const id = log.entityId || '—';
  const metadata = formatAuditMetadata(t, log.metadata ?? extractDescriptionMetadata(log.description));

  return metadata
    ? t('audit_description_with_details', { action, entity, id, metadata })
    : t('audit_description', { action, entity, id });
};

const getActionChipSx = (theme, action) => {
  const key = String(action || '').toUpperCase();
  const paletteKey = key.includes('UNBAN') || key.includes('RESTORE') || key.includes('APPROVE')
    ? 'success'
    : key.includes('DELETE') || key.includes('BAN') || key.includes('REJECT')
      ? 'error'
      : key.includes('CREATE')
        ? 'info'
        : 'primary';
  const main = theme.palette[paletteKey].main;

  return {
    width: '100%',
    maxWidth: '100%',
    height: 'auto',
    minHeight: 30,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    borderRadius: 1.5,
    color: main,
    bgcolor: alpha(main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
    border: `1px solid ${alpha(main, theme.palette.mode === 'dark' ? 0.28 : 0.16)}`,
    '& .MuiChip-label': {
      display: 'block',
      width: '100%',
      whiteSpace: 'normal',
      overflow: 'visible',
      textOverflow: 'clip',
      lineHeight: 1.35,
      fontWeight: 800,
      px: 1,
      py: 0.65,
    },
  };
};

const AdminAuditLogsPage = () => {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { setBreadcrumbs } = useOutletContext();

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('nav_audit_logs'), active: true }]);
  }, [setBreadcrumbs]);
  const { loading, auditLogs } = useAdminAuditLogsData();

  const [dateFrom, setDateFrom] = useState('');
  const [entityFilter, setEntityFilter] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [rollingCutoffMs, setRollingCutoffMs] = useState(null);

  const entityOptions = useMemo(() => {
    const fromData = new Set(auditLogs.map((log) => String(log.entityType || '')).filter(Boolean));
    DEFAULT_ENTITY_TYPES.forEach((e) => fromData.add(e));
    return Array.from(fromData).sort();
  }, [auditLogs]);


  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = auditLogs.filter((log) => {
      if (entityFilter.length > 0 && !entityFilter.includes(String(log.entityType || ''))) return false;
      
      const ts = new Date(log.timestamp).getTime();
      if (!Number.isNaN(ts)) {
        if (rollingCutoffMs != null && ts < rollingCutoffMs) return false;
        if (rollingCutoffMs == null && dateFrom) {
          const from = new Date(`${dateFrom}T00:00:00`).getTime();
          if (ts < from) return false;
        }
      }

      if (q) {
        const haystack = [log.description, log.actorName, log.studentId, log.userEmail, log.entityType, String(log.entityId ?? ''), log.entityName, log.action]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [auditLogs, entityFilter, dateFrom, search, rollingCutoffMs]);

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      enqueueSnackbar(t('audit_no_data_export'), { variant: 'warning' });
      return;
    }
    const escape = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const header = ['timestamp', 'studentId', 'action', 'entityType', 'status', 'description'];
    const rows = filteredLogs.map(log => [
      formatDateTimeWithSeconds(log.timestamp),
      log.studentId,
      log.action,
      log.entityType,
      log.status,
      log.description
    ].map(escape).join(','));
    
    const csv = [header.map(escape).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    enqueueSnackbar(t('audit_export_success'), { variant: 'success' });
  };

  const columns = [
    { id: 'timestamp', label: t('audit_col_time'), minWidth: 150, render: (val) => formatDateTimeWithSeconds(val) },
    {
      id: 'studentId',
      label: t('audit_col_actor'),
      minWidth: 190,
      render: (val, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.actorName || val || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">{row.userEmail || ''}</Typography>
        </Box>
      )
    },
    {
      id: 'action',
      label: t('audit_col_action'),
      minWidth: 170,
      render: (val) => (
        <Chip
          label={formatAuditLabel(t, AUDIT_ACTION_LABEL_KEYS, val)}
          size="small"
          variant="outlined"
          sx={getActionChipSx(theme, val)}
        />
      )
    },
    { id: 'entityType', label: t('audit_col_entity'), minWidth: 150, render: (val) => formatAuditLabel(t, AUDIT_ENTITY_LABEL_KEYS, val) },
    { id: 'entityId', label: t('audit_col_entity_id'), minWidth: 110 },
    {
      id: 'status',
      label: t('audit_col_result'),
      render: (val) => <AdminStatusChip status={val} category="audit" />
    },
    {
      id: 'description',
      label: t('audit_col_desc'),
      minWidth: 380,
      render: (_, row) => (
        <Typography variant="body2" sx={{ maxWidth: 420, whiteSpace: 'normal', lineHeight: 1.45 }}>
          {formatAuditDescription(t, row)}
        </Typography>
      )
    }
  ];

  const renderExpandableRow = (log) => {
    const hasRequestInfo = Boolean(log.ipAddress || log.requestPath || log.userAgent || log.executionTime != null);

    return (
    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t('audit_request_info')}</Typography>
          {hasRequestInfo ? (
            <Stack spacing={0.5}>
              <Typography variant="caption"><strong>IP:</strong> {log.ipAddress || '-'}</Typography>
              <Typography variant="caption"><strong>Path:</strong> {log.requestPath || '-'}</Typography>
              <Typography variant="caption"><strong>User Agent:</strong> {log.userAgent || '-'}</Typography>
              <Typography variant="caption"><strong>Execution:</strong> {log.executionTime != null ? `${log.executionTime}ms` : '-'}</Typography>
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
              {t('audit_request_unavailable')}
            </Typography>
          )}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>{t('audit_old_value')}</Typography>
            <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11, color: 'text.secondary' }}>
              {stringifyJson(log.oldValue)}
            </Box>
          </Paper>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>{t('audit_new_value')}</Typography>
            <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11, color: 'text.secondary' }}>
              {stringifyJson(log.newValue)}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
  };

  const Filters = (
    <Stack direction="row" spacing={1}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel shrink>{t('audit_entity_filter')}</InputLabel>
        <Select
          multiple
          displayEmpty
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }}
          input={<OutlinedInput label={t('audit_entity_filter')} />}
          renderValue={(selected) => selected.length ? t('audit_selected_count', { count: selected.length }) : t('filter_all')}
        >
          {entityOptions.map((e) => (
            <MenuItem key={e} value={e}>
              <Checkbox checked={entityFilter.includes(e)} size="small" />
              <ListItemText primary={formatAuditLabel(t, AUDIT_ENTITY_LABEL_KEYS, e)} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        size="small"
        type="date"
        label={t('admin:from_date')}
        value={dateFrom}
        onChange={(e) => { setRollingCutoffMs(null); setDateFrom(e.target.value); setPage(0); }}
        InputLabelProps={{ shrink: true }}
      />
    </Stack>
  );

  const [now] = useState(() => Date.now());
  const stats = {
    totalLogs: auditLogs.length,
    failedLogs: auditLogs.filter(l => l.status === 'FAILED').length,
    distinctUsers: new Set(auditLogs.map(l => l.userId)).size,
    last24h: auditLogs.filter(l => new Date(l.timestamp) > new Date(now - 24*60*60*1000)).length
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            {t('admin:audit_logs_heading')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            {t('admin:audit_logs_subtitle')}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExportCsv}
        >
          {t('admin:export_data')}
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          mb: 4,
          '& > *': {
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 0' },
          },
        }}
      >
        <AdminDashboardMetricTile
          label={t('admin:audit_total')}
          value={stats.totalLogs}
          icon={<HistoryIcon />}
        />
        <AdminDashboardMetricTile
          label={t('admin:audit_24h')}
          value={stats.last24h}
          icon={<HistoryIcon />}
          valueColor="info.main"
        />
        <AdminDashboardMetricTile
          label={t('admin:audit_active_users')}
          value={stats.distinctUsers}
          icon={<SecurityIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label={t('admin:audit_system_errors')}
          value={stats.failedLogs}
          icon={<SecurityIcon />}
          valueColor="error.main"
        />
      </Box>

      <AdminDataTable
        columns={columns}
        rows={filteredLogs.slice(page * rowsPerPage, (page + 1) * rowsPerPage)}
        totalCount={filteredLogs.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        searchValue={search}
        filters={Filters}
        renderExpandableRow={renderExpandableRow}
        loading={loading}
      />
    </Box>
  );
};

export default AdminAuditLogsPage;
