import { useMemo, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import AdminDataTable from '../../components/admin/AdminDataTable';
import useAdminAuditLogsData from '../../hooks/admin/useAdminAuditLogsData';
import { formatDateTimeWithSeconds } from '../../utils/dateFormatter';
import { stringifyJson } from '../../utils/stringUtils';

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
  const metadata = formatAuditMetadata(t, log.metadata);

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

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [adminUserId, setAdminUserId] = useState('');
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filters = useMemo(() => ({
    page,
    size: rowsPerPage,
    q: search,
    adminUserId: adminUserId || undefined,
    action: action || undefined,
    resourceType: resourceType || undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
  }), [page, rowsPerPage, search, adminUserId, action, resourceType, dateFrom, dateTo]);

  const { loading, rows, total, facets, summary, exportCsv } = useAdminAuditLogsData(filters);

  const stats = useMemo(() => ({
    totalActions: summary.reduce((sum, a) => sum + (a.totalActions || 0), 0),
    failedActions: summary.reduce((sum, a) => sum + (a.failedActions || 0), 0),
    admins: summary.length,
    filtered: total,
  }), [summary, total]);

  const handleExportCsv = async () => {
    if (total === 0) {
      enqueueSnackbar(t('audit_no_data_export'), { variant: 'warning' });
      return;
    }
    try {
      await exportCsv();
      enqueueSnackbar(t('audit_export_success'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('audit_no_data_export'), { variant: 'error' });
    }
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
      ),
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
      ),
    },
    { id: 'entityType', label: t('audit_col_entity'), minWidth: 150, render: (val) => formatAuditLabel(t, AUDIT_ENTITY_LABEL_KEYS, val) },
    { id: 'entityId', label: t('audit_col_entity_id'), minWidth: 110 },
    {
      id: 'status',
      label: t('audit_col_result'),
      render: (val, row) => (
        <Stack spacing={0.25}>
          <AdminStatusChip status={val} category="audit" />
          {row.statusCode != null && (
            <Typography variant="caption" color="text.secondary">{row.statusCode}</Typography>
          )}
        </Stack>
      ),
    },
    {
      id: 'description',
      label: t('audit_col_desc'),
      minWidth: 380,
      render: (_, row) => (
        <Typography variant="body2" sx={{ maxWidth: 420, whiteSpace: 'normal', lineHeight: 1.45 }}>
          {formatAuditDescription(t, row)}
        </Typography>
      ),
    },
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

  const resetPageAnd = (setter) => (value) => { setter(value); setPage(0); };

  const Filters = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <FormControl size="small" sx={{ minWidth: 190 }}>
        <InputLabel shrink>{t('audit_filter_admin', { defaultValue: 'Quản trị viên' })}</InputLabel>
        <Select
          displayEmpty
          value={adminUserId}
          onChange={(e) => resetPageAnd(setAdminUserId)(e.target.value)}
          input={<OutlinedInput label={t('audit_filter_admin', { defaultValue: 'Quản trị viên' })} />}
          renderValue={(selected) => {
            if (!selected) return t('filter_all');
            const found = facets.admins.find((a) => String(a.adminUserId) === String(selected));
            return found?.adminFullName || found?.adminEmail || `#${selected}`;
          }}
        >
          <MenuItem value="">{t('filter_all')}</MenuItem>
          {facets.admins.map((a) => (
            <MenuItem key={a.adminUserId} value={a.adminUserId}>
              {a.adminFullName || a.adminEmail || `#${a.adminUserId}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel shrink>{t('audit_col_action')}</InputLabel>
        <Select
          displayEmpty
          value={action}
          onChange={(e) => resetPageAnd(setAction)(e.target.value)}
          input={<OutlinedInput label={t('audit_col_action')} />}
          renderValue={(selected) => (selected ? formatAuditLabel(t, AUDIT_ACTION_LABEL_KEYS, selected) : t('filter_all'))}
        >
          <MenuItem value="">{t('filter_all')}</MenuItem>
          {facets.actions.map((a) => (
            <MenuItem key={a} value={a}>{formatAuditLabel(t, AUDIT_ACTION_LABEL_KEYS, a)}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel shrink>{t('audit_entity_filter')}</InputLabel>
        <Select
          displayEmpty
          value={resourceType}
          onChange={(e) => resetPageAnd(setResourceType)(e.target.value)}
          input={<OutlinedInput label={t('audit_entity_filter')} />}
          renderValue={(selected) => (selected ? formatAuditLabel(t, AUDIT_ENTITY_LABEL_KEYS, selected) : t('filter_all'))}
        >
          <MenuItem value="">{t('filter_all')}</MenuItem>
          {facets.resourceTypes.map((r) => (
            <MenuItem key={r} value={r}>{formatAuditLabel(t, AUDIT_ENTITY_LABEL_KEYS, r)}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        size="small"
        type="date"
        label={t('from_date')}
        value={dateFrom}
        onChange={(e) => resetPageAnd(setDateFrom)(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        size="small"
        type="date"
        label={t('to_date', { defaultValue: 'Đến ngày' })}
        value={dateTo}
        onChange={(e) => resetPageAnd(setDateTo)(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
    </Stack>
  );

  const topAdmins = summary.slice(0, 6);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            {t('audit_logs_heading')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            {t('audit_logs_subtitle')}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExportCsv}
        >
          {t('export_data')}
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
          label={t('audit_total')}
          value={stats.totalActions}
          icon={<HistoryIcon />}
        />
        <AdminDashboardMetricTile
          label={t('audit_filtered', { defaultValue: 'Kết quả lọc' })}
          value={stats.filtered}
          icon={<HistoryIcon />}
          valueColor="info.main"
        />
        <AdminDashboardMetricTile
          label={t('audit_active_admins', { defaultValue: 'Số quản trị viên' })}
          value={stats.admins}
          icon={<SecurityIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label={t('audit_system_errors')}
          value={stats.failedActions}
          icon={<SecurityIcon />}
          valueColor="error.main"
        />
      </Box>

      {topAdmins.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            {t('audit_per_admin_heading', { defaultValue: 'Hoạt động theo quản trị viên' })}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
            {topAdmins.map((a) => {
              const active = String(adminUserId) === String(a.adminUserId);
              return (
                <Paper
                  key={a.adminUserId}
                  variant="outlined"
                  onClick={() => resetPageAnd(setAdminUserId)(active ? '' : a.adminUserId)}
                  sx={{
                    p: 2,
                    minWidth: 220,
                    cursor: 'pointer',
                    borderColor: active ? 'primary.main' : undefined,
                    bgcolor: active ? alpha(theme.palette.primary.main, 0.06) : undefined,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <PersonOutlineIcon fontSize="small" color="primary" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                        {a.adminFullName || `#${a.adminUserId}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {a.adminEmail || a.adminRole || ''}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <Typography variant="caption">
                      <strong>{a.totalActions ?? 0}</strong> {t('audit_actions_word', { defaultValue: 'thao tác' })}
                    </Typography>
                    {(a.failedActions ?? 0) > 0 && (
                      <Typography variant="caption" color="error.main">
                        <strong>{a.failedActions}</strong> {t('audit_failed_word', { defaultValue: 'lỗi' })}
                      </Typography>
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {t('audit_last_active', { defaultValue: 'Gần nhất' })}: {a.lastActionAt ? formatDateTimeWithSeconds(a.lastActionAt) : '-'}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      )}

      <AdminDataTable
        columns={columns}
        rows={rows}
        totalCount={total}
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
