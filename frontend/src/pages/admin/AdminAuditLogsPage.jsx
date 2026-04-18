import { useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import { useAdminSystemContext } from '../../contexts/AdminSystemContext';

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

const formatDateTimeCompact = (value) => {
  if (!value) {
    return '-';
  }
  try {
    const parsedDate = new Date(value);
    return parsedDate.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
};

const formatIsoDateInput = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const stringifyJson = (value) => {
  if (value == null) {
    return '-';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const truncateText = (text, maxLen = 64) => {
  if (text == null || text === '') {
    return '-';
  }
  const s = String(text);
  if (s.length <= maxLen) {
    return s;
  }
  return `${s.slice(0, maxLen)}…`;
};

const AuditExpandRow = ({ log, open, colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} sx={{ borderBottom: open ? 1 : 0, py: 0, bgcolor: 'action.hover' }}>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ py: 2, px: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              IP: {log.ipAddress || '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Path: {log.requestPath || '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Execution: {log.executionTime != null ? `${log.executionTime} ms` : '-'}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            User agent: {log.userAgent || '-'}
          </Typography>
          {log.status === 'FAILED' && log.errorMessage ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {log.errorMessage}
            </Typography>
          ) : null}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Paper variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Old value
              </Typography>
              <Box
                component="pre"
                sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12 }}
              >
                {stringifyJson(log.oldValue)}
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                New value
              </Typography>
              <Box
                component="pre"
                sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12 }}
              >
                {stringifyJson(log.newValue)}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Collapse>
    </TableCell>
  </TableRow>
);

const AdminAuditLogsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { loading, auditLogs } = useAdminSystemContext();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [entityFilter, setEntityFilter] = useState([]);
  const [actionFilter, setActionFilter] = useState([]);
  const [userFilter, setUserFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [expandedId, setExpandedId] = useState(null);
  const [rollingCutoffMs, setRollingCutoffMs] = useState(null);

  const entityOptions = useMemo(() => {
    const fromData = new Set(auditLogs.map((log) => String(log.entityType || '')).filter(Boolean));
    DEFAULT_ENTITY_TYPES.forEach((e) => fromData.add(e));
    return Array.from(fromData).sort();
  }, [auditLogs]);

  const actionOptions = useMemo(() => {
    const fromData = new Set(auditLogs.map((log) => String(log.action || '')).filter(Boolean));
    DEFAULT_ACTIONS.forEach((e) => fromData.add(e));
    return Array.from(fromData).sort();
  }, [auditLogs]);

  const userOptions = useMemo(() => {
    const map = new Map();
    auditLogs.forEach((log) => {
      if (log.userId != null && log.userName) {
        map.set(Number(log.userId), String(log.userName));
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([userId, userName]) => ({ userId, userName }));
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = auditLogs.filter((log) => {
      if (entityFilter.length > 0 && !entityFilter.includes(String(log.entityType || ''))) {
        return false;
      }
      if (actionFilter.length > 0 && !actionFilter.includes(String(log.action || ''))) {
        return false;
      }
      if (userFilter !== 'ALL' && Number(log.userId) !== Number(userFilter)) {
        return false;
      }
      const t = new Date(log.timestamp).getTime();
      if (!Number.isNaN(t)) {
        if (rollingCutoffMs != null && t < rollingCutoffMs) {
          return false;
        }
        if (rollingCutoffMs == null && dateFrom) {
          const from = new Date(`${dateFrom}T00:00:00`).getTime();
          if (t < from) {
            return false;
          }
        }
        if (rollingCutoffMs == null && dateTo) {
          const to = new Date(`${dateTo}T23:59:59.999`).getTime();
          if (t > to) {
            return false;
          }
        }
      }
      if (q) {
        const haystack = [
          log.description,
          log.userName,
          log.userEmail,
          log.entityType,
          String(log.entityId ?? ''),
          log.entityName,
          log.action,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }
      return true;
    });
    return [...list].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    });
  }, [auditLogs, entityFilter, actionFilter, userFilter, dateFrom, dateTo, search, rollingCutoffMs]);

  const pagedLogs = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, page, rowsPerPage]);

  const applyPreset = (preset) => {
    const now = new Date();
    if (preset === 'today') {
      setRollingCutoffMs(null);
      const today = formatIsoDateInput(now);
      setDateFrom(today);
      setDateTo(today);
      setEntityFilter([]);
      setActionFilter([]);
      setUserFilter('ALL');
      setPage(0);
      return;
    }
    if (preset === 'bans7d') {
      setRollingCutoffMs(null);
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      setDateFrom(formatIsoDateInput(from));
      setDateTo(formatIsoDateInput(now));
      setEntityFilter(['USER']);
      setActionFilter(['BAN']);
      setUserFilter('ALL');
      setPage(0);
      return;
    }
    if (preset === 'forum24h') {
      setDateFrom('');
      setDateTo('');
      setEntityFilter(['FORUM_POST', 'FORUM_TOPIC', 'FORUM_CATEGORY']);
      setActionFilter([]);
      setUserFilter('ALL');
      setPage(0);
      setRollingCutoffMs(now.getTime() - 24 * 60 * 60 * 1000);
      return;
    }
    if (preset === 'admin30d') {
      setRollingCutoffMs(null);
      const from = new Date(now);
      from.setDate(now.getDate() - 29);
      setDateFrom(formatIsoDateInput(from));
      setDateTo(formatIsoDateInput(now));
      setEntityFilter([]);
      setActionFilter(['CREATE', 'UPDATE', 'DELETE', 'BAN', 'APPROVE', 'REJECT']);
      setUserFilter('ALL');
      setPage(0);
    }
  };

  const buildExportRows = () =>
    filteredLogs.map((log) => ({
      timestamp: formatDateTimeCompact(log.timestamp),
      userName: log.userName || '',
      userEmail: log.userEmail || '',
      userId: log.userId ?? '',
      action: log.action || '',
      entityType: log.entityType || '',
      entityId: log.entityId ?? '',
      entityName: log.entityName || '',
      status: log.status || '',
      description: log.description || '',
      oldValue: log.oldValue,
      newValue: log.newValue,
      ipAddress: log.ipAddress || '',
      requestPath: log.requestPath || '',
    }));

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      enqueueSnackbar('No rows to export.', { variant: 'warning' });
      return;
    }
    const escape = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const header = [
      'timestamp',
      'userName',
      'userEmail',
      'userId',
      'action',
      'entityType',
      'entityId',
      'entityName',
      'status',
      'description',
      'oldValue',
      'newValue',
    ];
    const rows = buildExportRows().map((row) =>
      [
        row.timestamp,
        row.userName,
        row.userEmail,
        row.userId,
        row.action,
        row.entityType,
        row.entityId,
        row.entityName,
        row.status,
        row.description,
        stringifyJson(row.oldValue),
        stringifyJson(row.newValue),
      ]
        .map(escape)
        .join(','),
    );
    const csv = [header.map(escape).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    enqueueSnackbar('Exported CSV.', { variant: 'success' });
  };

  const handleExportJson = () => {
    if (filteredLogs.length === 0) {
      enqueueSnackbar('No rows to export.', { variant: 'warning' });
      return;
    }
    const json = JSON.stringify(buildExportRows(), null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    enqueueSnackbar('Exported JSON.', { variant: 'success' });
  };

  const colSpan = 9;

  return (
    <Box sx={{ width: '100%' }}>
        <AdminSectionPanel
          title="Audit logs"
          subtitle="Advanced filters, row expand for old/new payloads, export CSV or JSON (client-side for demo)."
        >
          {loading ? (
            <Stack spacing={1}>
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={320} />
            </Stack>
          ) : (
            <>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 2,
                  alignItems: 'flex-end',
                }}
              >
                <TextField
                  size="small"
                  label="Search"
                  placeholder="Entity ID, description, user…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  sx={{ flex: '2 1 280px', minWidth: 240 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="From"
                  value={dateFrom}
                  onChange={(e) => {
                    setRollingCutoffMs(null);
                    setDateFrom(e.target.value);
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: '1 1 160px', minWidth: 140 }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="To"
                  value={dateTo}
                  onChange={(e) => {
                    setRollingCutoffMs(null);
                    setDateTo(e.target.value);
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: '1 1 160px', minWidth: 140 }}
                />
                <FormControl size="small" sx={{ flex: '1 1 220px', minWidth: 220 }}>
                  <InputLabel>Entity type</InputLabel>
                  <Select
                    multiple
                    value={entityFilter}
                    onChange={(e) => {
                      setEntityFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value);
                      setPage(0);
                    }}
                    input={<OutlinedInput label="Entity type" />}
                    renderValue={(selected) => (selected.length ? selected.join(', ') : 'All')}
                  >
                    {entityOptions.map((entity) => (
                      <MenuItem key={entity} value={entity}>
                        <Checkbox checked={entityFilter.includes(entity)} size="small" />
                        <ListItemText primary={entity} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ flex: '1 1 220px', minWidth: 220 }}>
                  <InputLabel>Action</InputLabel>
                  <Select
                    multiple
                    value={actionFilter}
                    onChange={(e) => {
                      setActionFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value);
                      setPage(0);
                    }}
                    input={<OutlinedInput label="Action" />}
                    renderValue={(selected) => (selected.length ? selected.join(', ') : 'All')}
                  >
                    {actionOptions.map((action) => (
                      <MenuItem key={action} value={action}>
                        <Checkbox checked={actionFilter.includes(action)} size="small" />
                        <ListItemText primary={action} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  select
                  size="small"
                  label="User (actor)"
                  value={userFilter}
                  onChange={(e) => {
                    setUserFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{ flex: '1 1 200px', minWidth: 180 }}
                >
                  <MenuItem value="ALL">All</MenuItem>
                  {userOptions.map(({ userId, userName }) => (
                    <MenuItem key={userId} value={String(userId)}>
                      {userName} (#{userId})
                    </MenuItem>
                  ))}
                </TextField>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button size="small" variant="outlined" onClick={() => applyPreset('today')} sx={{ textTransform: 'none' }}>
                    Today
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => applyPreset('bans7d')} sx={{ textTransform: 'none' }}>
                    User bans (7d)
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => applyPreset('forum24h')} sx={{ textTransform: 'none' }}>
                    Forum moderation (24h)
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => applyPreset('admin30d')} sx={{ textTransform: 'none' }}>
                    Admin actions (30d)
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: { md: 'auto' } }}>
                  <Button size="small" variant="outlined" onClick={handleExportCsv} sx={{ textTransform: 'none', fontWeight: 700 }}>
                    Export CSV
                  </Button>
                  <Button size="small" variant="outlined" onClick={handleExportJson} sx={{ textTransform: 'none', fontWeight: 700 }}>
                    Export JSON
                  </Button>
                </Box>
              </Box>

              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 48 }} aria-label="Expand" />
                        <TableCell>Timestamp</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Entity type</TableCell>
                        <TableCell>Entity ID</TableCell>
                        <TableCell>Entity name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={colSpan}>
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                              No audit rows match filters.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagedLogs.flatMap((log) => {
                          const open = expandedId === log.id;
                          const mainRow = (
                            <TableRow key={log.id} hover>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  aria-label="expand row"
                                  onClick={() => setExpandedId(open ? null : log.id)}
                                >
                                  {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                              </TableCell>
                              <TableCell>{formatDateTimeCompact(log.timestamp)}</TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {log.userName || '-'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {log.userEmail || ''}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={String(log.action || '-').toUpperCase()}
                                  sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                />
                              </TableCell>
                              <TableCell>{log.entityType || '-'}</TableCell>
                              <TableCell>{log.entityId ?? '-'}</TableCell>
                              <TableCell sx={{ maxWidth: 160 }}>
                                <Tooltip title={log.entityName || '-'}>
                                  <Typography variant="body2" noWrap>
                                    {log.entityName || '-'}
                                  </Typography>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <AdminStatusChip status={log.status} category="audit" />
                              </TableCell>
                              <TableCell sx={{ maxWidth: 280 }}>
                                <Tooltip title={log.description || '-'} placement="top-start">
                                  <Typography variant="body2" noWrap>
                                    {truncateText(log.description, 72)}
                                  </Typography>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                          const expandRow = (
                            <AuditExpandRow key={`${log.id}-expand`} log={log} open={open} colSpan={colSpan} />
                          );
                          return [mainRow, expandRow];
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredLogs.length}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  onPageChange={(_, next) => setPage(next)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[50, 100]}
                  labelRowsPerPage="Rows per page"
                />
              </Paper>
            </>
          )}
        </AdminSectionPanel>
    </Box>
  );
};

export default AdminAuditLogsPage;
