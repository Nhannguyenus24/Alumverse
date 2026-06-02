import { useMemo, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
  Grid,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import AdminDataTable from '../../components/admin/AdminDataTable';
import { useAdminSystemContext } from '../../stores/AdminStore';
import { formatDateTimeWithSeconds } from '../../utils/dateFormatter';
import { stringifyJson, truncateText } from '../../utils/stringUtils';

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


const AdminAuditLogsPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { setBreadcrumbs } = useOutletContext();

  useEffect(() => {
    setBreadcrumbs?.([{ label: 'Nhật ký hệ thống', active: true }]);
  }, [setBreadcrumbs]);
  const { loading, auditLogs } = useAdminSystemContext();

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
      
      const t = new Date(log.timestamp).getTime();
      if (!Number.isNaN(t)) {
        if (rollingCutoffMs != null && t < rollingCutoffMs) return false;
        if (rollingCutoffMs == null && dateFrom) {
          const from = new Date(`${dateFrom}T00:00:00`).getTime();
          if (t < from) return false;
        }
      }

      if (q) {
        const haystack = [log.description, log.userName, log.userEmail, log.entityType, String(log.entityId ?? ''), log.entityName, log.action]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [auditLogs, entityFilter, dateFrom, search, rollingCutoffMs]);

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      enqueueSnackbar('Không có dữ liệu để xuất.', { variant: 'warning' });
      return;
    }
    const escape = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const header = ['timestamp', 'userName', 'action', 'entityType', 'status', 'description'];
    const rows = filteredLogs.map(log => [
      formatDateTimeWithSeconds(log.timestamp),
      log.userName,
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
    enqueueSnackbar('Đã xuất file CSV.', { variant: 'success' });
  };

  const columns = [
    { id: 'timestamp', label: 'Thời gian', render: (val) => formatDateTimeWithSeconds(val) },
    { 
      id: 'userName', 
      label: 'Người thực hiện', 
      render: (val, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{val || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">{row.userEmail || ''}</Typography>
        </Box>
      )
    },
    { 
      id: 'action', 
      label: 'Hành động', 
      render: (val) => (
        <Typography variant="caption" sx={{ fontWeight: 700, px: 1, py: 0.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          {String(val || '-').toUpperCase()}
        </Typography>
      )
    },
    { id: 'entityType', label: 'Đối tượng' },
    { id: 'entityId', label: 'ID Đối tượng' },
    { 
      id: 'status', 
      label: 'Kết quả', 
      render: (val) => <AdminStatusChip status={val} category="audit" /> 
    },
    { 
      id: 'description', 
      label: 'Mô tả', 
      render: (val) => <Typography variant="body2" noWrap sx={{ maxWidth: 240 }}>{truncateText(val, 60)}</Typography> 
    }
  ];

  const renderExpandableRow = (log) => (
    <Box sx={{ p: 2, bgcolor: alpha(theme.palette.action.hover, 0.3), borderRadius: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Thông tin yêu cầu</Typography>
          <Stack spacing={0.5}>
            <Typography variant="caption"><strong>IP:</strong> {log.ipAddress || '-'}</Typography>
            <Typography variant="caption"><strong>Path:</strong> {log.requestPath || '-'}</Typography>
            <Typography variant="caption"><strong>User Agent:</strong> {log.userAgent || '-'}</Typography>
            <Typography variant="caption"><strong>Execution:</strong> {log.executionTime != null ? `${log.executionTime}ms` : '-'}</Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Giá trị cũ</Typography>
            <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11, color: 'text.secondary' }}>
              {stringifyJson(log.oldValue)}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Giá trị mới</Typography>
            <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11, color: 'text.secondary' }}>
              {stringifyJson(log.newValue)}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const Filters = (
    <Stack direction="row" spacing={1}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Đối tượng</InputLabel>
        <Select
          multiple
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }}
          input={<OutlinedInput label="Đối tượng" />}
          renderValue={(selected) => selected.length ? `${selected.length} đã chọn` : 'Tất cả'}
        >
          {entityOptions.map((e) => (
            <MenuItem key={e} value={e}>
              <Checkbox checked={entityFilter.includes(e)} size="small" />
              <ListItemText primary={e} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        size="small"
        type="date"
        label="Từ ngày"
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
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -1 }}>
            Nhật ký hệ thống
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            Giám sát các hoạt động của người dùng, thay đổi dữ liệu và cảnh báo an ninh.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExportCsv}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
        >
          Xuất dữ liệu
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
          label="Tổng nhật ký"
          value={stats.totalLogs}
          icon={<HistoryIcon />}
        />
        <AdminDashboardMetricTile
          label="Hoạt động 24h"
          value={stats.last24h}
          icon={<HistoryIcon />}
          valueColor="info.main"
        />
        <AdminDashboardMetricTile
          label="Người dùng hoạt động"
          value={stats.distinctUsers}
          icon={<SecurityIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label="Lỗi hệ thống"
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
