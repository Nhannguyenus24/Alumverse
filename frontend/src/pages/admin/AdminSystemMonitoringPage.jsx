import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
  Alert,
  alpha,
  Card,
  CardContent
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';

const PROMETHEUS_URL_RANGE = 'http://168.144.102.181:9090/api/v1/query_range';
const PROMETHEUS_URL_INSTANT = 'http://168.144.102.181:9090/api/v1/query';

const QUERIES = {
  requestRate: 'sum(rate(http_endpoint_requests_total[5m]))',
  errorRate: 'sum(rate(http_endpoint_errors_total[5m]))',
  latencyAvg: '(sum(rate(http_endpoint_latency_seconds_sum[5m])) / sum(rate(http_endpoint_latency_seconds_count[5m]))) * 1000',
  latencyP50: 'histogram_quantile(0.50, sum(rate(http_endpoint_latency_seconds_bucket[5m])) by (le)) * 1000',
  latencyP99: 'histogram_quantile(0.99, sum(rate(http_endpoint_latency_seconds_bucket[5m])) by (le)) * 1000',
  cpuSystem: 'system_cpu_usage * 100',
  cpuProcess: 'process_cpu_usage * 100',
  memoryHeap: 'sum(jvm_memory_used_bytes{area="heap"}) / 1024 / 1024',
  gcPause: 'sum(rate(jvm_gc_pause_seconds_sum[5m])) * 1000',
  jvmThreadsCurrent: 'sum(jvm_threads_live_threads)',
  jvmThreadsDaemon: 'sum(jvm_threads_daemon_threads)',
  jvmThreadsPeak: 'sum(jvm_threads_peak_threads)',
  dbActiveConns: 'sum(r2dbc_pool_acquired_connections)',
  dbIdleConns: 'sum(r2dbc_pool_idle_connections)',
  dbPendingConns: 'sum(r2dbc_pool_pending_connections)'
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d32f2f', '#1976d2', '#388e3c', '#fbc02d', '#7b1fa2', '#c2185b'];


const adminTableContainerSx = {
  maxHeight: 320,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  bgcolor: 'background.paper',
  overflow: 'auto',
  boxShadow: 'none',
};

const adminTableHeadCellSx = {
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  fontWeight: 800,
  fontSize: 12,
  letterSpacing: 0.3,
  textTransform: 'uppercase',
  py: 1.5,
};

const monitoringMetricGridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
    lg: 'repeat(4, minmax(0, 1fr))',
  },
  gap: 3,
  alignItems: 'stretch',
  '& > *': {
    minWidth: 0,
    height: '100%',
  },
};

const monitoringPanelGridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    xl: 'repeat(2, minmax(0, 1fr))',
  },
  gap: 3,
  alignItems: 'stretch',
  '& > *': {
    minWidth: 0,
    mb: '0 !important',
  },
};

const monitoringChartBoxSx = {
  height: { xs: 300, md: 340 },
  minWidth: 0,
};

const monitoringPanelSx = {
  mb: 0,
  borderRadius: 2,
};

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
};


const fetchPrometheusRange = async (query, start, end, step) => {
  try {
    const res = await axios.get(PROMETHEUS_URL_RANGE, {
      params: { query, start, end, step: `${step}s` },
      timeout: 10000
    });
    if (res.data && res.data.data && res.data.data.result.length > 0) {
      return res.data.data.result[0].values;
    }
    return [];
  } catch (err) {
    console.error(`Error fetching range query: ${query}`, err);
    return [];
  }
};

const fetchPrometheusRangeMultiple = async (query, start, end, step) => {
  try {
    const res = await axios.get(PROMETHEUS_URL_RANGE, {
      params: { query, start, end, step: `${step}s` },
      timeout: 10000
    });
    if (res.data && res.data.data && res.data.data.result) {
      return res.data.data.result;
    }
    return [];
  } catch (err) {
    console.error(`Error fetching range multiple query: ${query}`, err);
    return [];
  }
};

const fetchPrometheusInstant = async (query, time) => {
  try {
    const res = await axios.get(PROMETHEUS_URL_INSTANT, {
      params: { query, time },
      timeout: 10000
    });
    if (res.data && res.data.data && res.data.data.result.length > 0) {
      return res.data.data.result;
    }
    return [];
  } catch (err) {
    console.error(`Error fetching instant query: ${query}`, err);
    return [];
  }
};

const AdminSystemMonitoringPage = () => {
  const theme = useTheme();
  const { t } = useTranslation(['admin']);

  const TIME_RANGES = useMemo(() => [
    { label: t('admin:system_monitoring.last_1h'), value: 1 },
    { label: t('admin:system_monitoring.last_3h'), value: 3 },
    { label: t('admin:system_monitoring.last_6h'), value: 6 },
    { label: t('admin:system_monitoring.last_12h'), value: 12 },
    { label: t('admin:system_monitoring.last_24h'), value: 24 },
    { label: t('admin:system_monitoring.custom_range'), value: 'custom' },
  ], [t]);

  const REFRESH_INTERVALS = useMemo(() => [
    { label: t('admin:system_monitoring.off'), value: 0 },
    { label: t('admin:system_monitoring.5s'), value: 5 },
    { label: t('admin:system_monitoring.10s'), value: 10 },
    { label: t('admin:system_monitoring.30s'), value: 30 },
    { label: t('admin:system_monitoring.1m'), value: 60 },
  ], [t]);
  
  const [timeRange, setTimeRange] = useState(1);
  const [customStart, setCustomStart] = useState(dayjs().subtract(1, 'hour'));
  const [customEnd, setCustomEnd] = useState(dayjs());
  const [refreshInterval, setRefreshInterval] = useState(10);
  
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [endpointStats, setEndpointStats] = useState([]);
  const [exceptionStats, setExceptionStats] = useState([]);
  const [summaryStats, setSummaryStats] = useState({ totalRequests: 0, totalErrors: 0, errorRate: 0, avgLatency: 0 });
  const [availableErrorCodes, setAvailableErrorCodes] = useState([]);
  const [availableStatusCodes, setAvailableStatusCodes] = useState([]);
  const [isolatedSeries, setIsolatedSeries] = useState({});
  const [error, setError] = useState(null);

  const handleLegendClick = (chartId, dataKey) => {
    setIsolatedSeries(prev => {
      if (prev[chartId] === dataKey) {
        const next = { ...prev };
        delete next[chartId];
        return next;
      }
      return { ...prev, [chartId]: dataKey };
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rangeSeconds = timeRange === 'custom' 
        ? Math.floor(customEnd.diff(customStart, 'second'))
        : timeRange * 3600;
        
      if (rangeSeconds <= 0) {
        setError(t('admin:system_monitoring.invalid_time_range'));
        setLoading(false);
        return;
      }
      
      // Calculate a clean step for range charts
      let step;
      if (rangeSeconds <= 3600) step = 30; // 30 seconds
      else if (rangeSeconds <= 3 * 3600) step = 60; // 1 minute
      else if (rangeSeconds <= 6 * 3600) step = 120; // 2 minutes
      else if (rangeSeconds <= 12 * 3600) step = 300; // 5 minutes
      else if (rangeSeconds <= 24 * 3600) step = 600; // 10 minutes
      else step = Math.max(900, Math.floor(rangeSeconds / 100));

      // Snap end time to a clean interval so timestamps look neat
      let endUnix = timeRange === 'custom' ? customEnd.unix() : Math.floor(Date.now() / 1000);
      const snapInterval = step >= 60 ? step : 60;
      endUnix = endUnix - (endUnix % snapInterval);
      
      const end = endUnix;
      const start = timeRange === 'custom' ? (customStart.unix() - (customStart.unix() % snapInterval)) : end - rangeSeconds;

      const [
        reqRateData,
        errRateData,
        latAvgData,
        latP50Data,
        latP99Data,
        cpuSysData,
        cpuProcData,
        memHeapData,
        gcPauseData,
        jvmThreadsCurrentData,
        jvmThreadsDaemonData,
        jvmThreadsPeakData,
        dbActiveConnsData,
        dbIdleConnsData,
        dbPendingConnsData,
        endpointDataRes,
        exceptionDataRes,
        endpointLatencyRes,
        exceptionTimeSeriesRes,
        statusTimeSeriesRes,
        totalRequestsRes,
        totalErrorsRes,
        currentAvgLatencyRes
      ] = await Promise.all([
        fetchPrometheusRange(QUERIES.requestRate, start, end, step),
        fetchPrometheusRange(QUERIES.errorRate, start, end, step),
        fetchPrometheusRange(QUERIES.latencyAvg, start, end, step),
        fetchPrometheusRange(QUERIES.latencyP50, start, end, step),
        fetchPrometheusRange(QUERIES.latencyP99, start, end, step),
        fetchPrometheusRange(QUERIES.cpuSystem, start, end, step),
        fetchPrometheusRange(QUERIES.cpuProcess, start, end, step),
        fetchPrometheusRange(QUERIES.memoryHeap, start, end, step),
        fetchPrometheusRange(QUERIES.gcPause, start, end, step),
        fetchPrometheusRange(QUERIES.jvmThreadsCurrent, start, end, step),
        fetchPrometheusRange(QUERIES.jvmThreadsDaemon, start, end, step),
        fetchPrometheusRange(QUERIES.jvmThreadsPeak, start, end, step),
        fetchPrometheusRange(QUERIES.dbActiveConns, start, end, step),
        fetchPrometheusRange(QUERIES.dbIdleConns, start, end, step),
        fetchPrometheusRange(QUERIES.dbPendingConns, start, end, step),
        fetchPrometheusInstant(`topk(50, sum by (path, method) (increase(http_endpoint_requests_total[${rangeSeconds}s])))`, end),
        fetchPrometheusInstant(`topk(50, sum by (error_code) (increase(api_errors_count_total[${rangeSeconds}s])))`, end),
        fetchPrometheusInstant(`sum by (path, method) (increase(http_endpoint_latency_seconds_sum[${rangeSeconds}s])) / sum by (path, method) (increase(http_endpoint_latency_seconds_count[${rangeSeconds}s])) * 1000`, end),
        fetchPrometheusRangeMultiple(`sum by (error_code) (increase(api_errors_count_total[5m]))`, start, end, step),
        fetchPrometheusRangeMultiple(`sum by (status) (rate(http_endpoint_requests_total[5m]))`, start, end, step),
        fetchPrometheusInstant(`sum(http_endpoint_requests_total)`, end),
        fetchPrometheusInstant(`sum(http_endpoint_errors_total)`, end),
        fetchPrometheusInstant(`sum(rate(http_endpoint_latency_seconds_sum[5m])) / sum(rate(http_endpoint_latency_seconds_count[5m])) * 1000`, end)
      ]);

      // Merge time-series data
      const mergedMap = new Map();
      const formatString = rangeSeconds > 86400 ? 'MM/DD HH:mm' : (step < 60 ? 'HH:mm:ss' : 'HH:mm');

      const processSeries = (series, key) => {
        series.forEach(([timestamp, value]) => {
          const t = parseInt(timestamp, 10);
          if (!mergedMap.has(t)) {
            mergedMap.set(t, { time: t, timeFormatted: dayjs(t * 1000).format(formatString) });
          }
          let numVal = parseFloat(value);
          if (isNaN(numVal)) numVal = 0;
          mergedMap.get(t)[key] = numVal;
        });
      };

      processSeries(reqRateData, 'reqRate');
      processSeries(errRateData, 'errRate');
      processSeries(latAvgData, 'latAvg');
      processSeries(latP50Data, 'latP50');
      processSeries(latP99Data, 'latP99');
      processSeries(cpuSysData, 'cpuSys');
      processSeries(cpuProcData, 'cpuProc');
      processSeries(memHeapData, 'memHeap');
      processSeries(gcPauseData, 'gcPause');
      processSeries(jvmThreadsCurrentData, 'threadsCurrent');
      processSeries(jvmThreadsDaemonData, 'threadsDaemon');
      processSeries(jvmThreadsPeakData, 'threadsPeak');
      processSeries(dbActiveConnsData, 'dbActive');
      processSeries(dbIdleConnsData, 'dbIdle');
      processSeries(dbPendingConnsData, 'dbPending');

      const errorCodesSet = new Set();
      if (exceptionTimeSeriesRes) {
        exceptionTimeSeriesRes.forEach(seriesObj => {
          const errorCode = seriesObj.metric.error_code || 'UNKNOWN';
          const key = `err_${errorCode}`;
          errorCodesSet.add(errorCode);
          
          seriesObj.values.forEach(([timestamp, value]) => {
            const t = parseInt(timestamp, 10);
            if (!mergedMap.has(t)) {
              mergedMap.set(t, { time: t, timeFormatted: dayjs(t * 1000).format(formatString) });
            }
            let numVal = parseFloat(value);
            if (isNaN(numVal)) numVal = 0;
            mergedMap.get(t)[key] = numVal;
          });
        });
      }
      setAvailableErrorCodes(Array.from(errorCodesSet));

      const statusCodesSet = new Set();
      if (statusTimeSeriesRes) {
        statusTimeSeriesRes.forEach(seriesObj => {
          const status = seriesObj.metric.status || 'UNKNOWN';
          const key = `status_${status}`;
          statusCodesSet.add(status);
          
          seriesObj.values.forEach(([timestamp, value]) => {
            const t = parseInt(timestamp, 10);
            if (!mergedMap.has(t)) {
              mergedMap.set(t, { time: t, timeFormatted: dayjs(t * 1000).format(formatString) });
            }
            let numVal = parseFloat(value);
            if (isNaN(numVal)) numVal = 0;
            mergedMap.get(t)[key] = numVal;
          });
        });
      }
      setAvailableStatusCodes(Array.from(statusCodesSet));

      const mergedArray = Array.from(mergedMap.values()).sort((a, b) => a.time - b.time);
      setChartData(mergedArray);

      const latencyMap = new Map();
      if (endpointLatencyRes && endpointLatencyRes.length > 0) {
        endpointLatencyRes.forEach(res => {
          const key = `${res.metric.method || 'UNKNOWN'}-${res.metric.path || 'Unknown'}`;
          let val = parseFloat(res.value[1]);
          if (isNaN(val)) val = 0;
          latencyMap.set(key, val);
        });
      }

      // Process instant queries for tables
      setEndpointStats(
        endpointDataRes
          .map(res => {
            const path = res.metric.path || 'Unknown';
            const method = res.metric.method || 'UNKNOWN';
            const key = `${method}-${path}`;
            return {
              path,
              method,
              count: parseFloat(res.value[1]),
              avgLatency: latencyMap.get(key) || 0
            };
          })
          .sort((a, b) => b.count - a.count)
      );

      setExceptionStats(
        exceptionDataRes
          .map(res => ({
            errorCode: res.metric.error_code || 'UNKNOWN_ERROR',
            count: parseFloat(res.value[1])
          }))
          .sort((a, b) => b.count - a.count)
      );
      
      const totalReq = totalRequestsRes.length > 0 ? parseFloat(totalRequestsRes[0].value[1]) : 0;
      const totalErr = totalErrorsRes.length > 0 ? parseFloat(totalErrorsRes[0].value[1]) : 0;
      const curAvgLat = currentAvgLatencyRes.length > 0 ? parseFloat(currentAvgLatencyRes[0].value[1]) : 0;
      
      setSummaryStats({
        totalRequests: totalReq,
        totalErrors: totalErr,
        errorRate: totalReq > 0 ? (totalErr / totalReq) * 100 : 0,
        avgLatency: curAvgLat
      });

    } catch (err) {
      console.error(err);
      setError(t('admin:system_monitoring.fetch_error'));
    } finally {
      setLoading(false);
    }
  }, [timeRange, customStart, customEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (refreshInterval > 0 && timeRange !== 'custom') {
      const interval = setInterval(() => {
        loadData();
      }, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, loadData, timeRange]);

  const renderTooltip = (props) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: 'background.paper', p: 1.5, border: '1px solid #ccc', borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="body2" color="text.secondary" mb={1}>{label}</Typography>
          {payload.map((entry, index) => (
            <Typography key={`item-${index}`} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value != null ? entry.value.toFixed(2) : '0'}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {t('admin:system_monitoring.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
              {t('admin:system_monitoring.subtitle')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ fontSize: 13, fontWeight: 600 }}>{t('admin:system_monitoring.time_range')}</InputLabel>
              <Select
                value={timeRange}
                label={t("admin:system_monitoring.time_range")}
                onChange={(e) => setTimeRange(e.target.value)}
                sx={{ fontSize: 13, fontWeight: 700, bgcolor: 'background.paper', borderRadius: 1.5 }}
              >
                {TIME_RANGES.map((r) => (
                  <MenuItem key={r.value} value={r.value} sx={{ fontSize: 13, fontWeight: 600 }}>{r.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {timeRange === 'custom' && (
              <Stack direction="row" spacing={2}>
                <DateTimePicker
                  label={t("admin:system_monitoring.start_date")}
                  value={customStart}
                  onChange={(newValue) => setCustomStart(newValue)}
                  slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
                />
                <DateTimePicker
                  label={t("admin:system_monitoring.end_date")}
                  value={customEnd}
                  onChange={(newValue) => setCustomEnd(newValue)}
                  slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
                />
              </Stack>
            )}

            <FormControl size="small" sx={{ minWidth: 120 }} disabled={timeRange === 'custom'}>
              <InputLabel sx={{ fontSize: 13, fontWeight: 600 }}>{t('admin:system_monitoring.auto_refresh')}</InputLabel>
              <Select
                value={refreshInterval}
                label={t("admin:system_monitoring.auto_refresh")}
                onChange={(e) => setRefreshInterval(e.target.value)}
                sx={{ fontSize: 13, fontWeight: 700, bgcolor: 'background.paper', borderRadius: 1.5 }}
              >
                {REFRESH_INTERVALS.map((r) => (
                  <MenuItem key={r.value} value={r.value} sx={{ fontSize: 13, fontWeight: 600 }}>{r.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title={t("admin:system_monitoring.force_refresh")}>
              <span>
                <IconButton
                  size="small"
                  onClick={loadData}
                  disabled={loading}
                  sx={{
                    color: 'primary.main',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.08),
                    border: '1px solid',
                    borderColor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.12),
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.14),
                    },
                    '& svg': {
                      transition: 'transform 0.1s',
                      animation: loading ? 'dashboardSpin 0.8s linear infinite' : 'none',
                      '@keyframes dashboardSpin': {
                        from: { transform: 'rotate(0deg)' },
                        to: { transform: 'rotate(360deg)' },
                      },
                    },
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading && chartData.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {chartData.length > 0 && (
          <Stack spacing={3}>
            {/* Summary Stats */}
            <Box sx={monitoringMetricGridSx}>
              <AdminDashboardMetricTile
                label={t('admin:system_monitoring.total_requests_all_time')}
                value={summaryStats.totalRequests.toLocaleString()}
                icon={<QueryStatsOutlinedIcon />}
                sx={{ flex: 'unset', borderRadius: 2.5 }}
              />
              <AdminDashboardMetricTile
                label={t('admin:system_monitoring.total_errors_all_time')}
                value={summaryStats.totalErrors.toLocaleString()}
                icon={<ErrorOutlineOutlinedIcon />}
                sx={{ flex: 'unset', borderRadius: 2.5 }}
              />
              <AdminDashboardMetricTile
                label={t('admin:system_monitoring.error_rate')}
                value={`${summaryStats.errorRate.toFixed(2)}%`}
                icon={<SpeedOutlinedIcon />}
                sx={{ flex: 'unset', borderRadius: 2.5 }}
              />
              <AdminDashboardMetricTile
                label={t('admin:system_monitoring.avg_latency_5m')}
                value={`${Number.isFinite(summaryStats.avgLatency) ? summaryStats.avgLatency.toFixed(2) : '0.00'} ms`}
                icon={<TimerOutlinedIcon />}
                sx={{ flex: 'unset', borderRadius: 2.5 }}
              />
            </Box>

            {/* Top Endpoints & Exceptions Tables */}
            <Box sx={monitoringPanelGridSx}>
              <AdminSectionPanel
                title={t('admin:system_monitoring.endpoints_request_volume')}
                subtitle={t('admin:system_monitoring.endpoints_request_volume_desc')}
                sx={monitoringPanelSx}
              >
                  <TableContainer component={Paper} sx={adminTableContainerSx}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={adminTableHeadCellSx}>{t('admin:system_monitoring.method')}</TableCell>
                          <TableCell sx={adminTableHeadCellSx}>{t('admin:system_monitoring.endpoint_path')}</TableCell>
                          <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.requests')}</TableCell>
                          <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.avg_latency_ms')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {endpointStats.length === 0 && (
                          <TableRow><TableCell colSpan={4} align="center">{t('admin:system_monitoring.no_data')}</TableCell></TableRow>
                        )}
                        {endpointStats.map((row, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontWeight: 'bold' }}>{row.method}</TableCell>
                            <TableCell>{row.path}</TableCell>
                            <TableCell align="right">{row.count.toFixed(0)}</TableCell>
                            <TableCell align="right">{row.avgLatency.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
              </AdminSectionPanel>

              <AdminSectionPanel
                title={t('admin:system_monitoring.app_exceptions_breakdown')}
                subtitle={t('admin:system_monitoring.app_exceptions_breakdown_desc')}
                sx={monitoringPanelSx}
              >
                  <TableContainer component={Paper} sx={adminTableContainerSx}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={adminTableHeadCellSx}>{t('admin:system_monitoring.error_code_exception')}</TableCell>
                          <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.occurrences')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {exceptionStats.length === 0 && (
                          <TableRow><TableCell colSpan={2} align="center">{t('admin:system_monitoring.no_data')}</TableCell></TableRow>
                        )}
                        {exceptionStats.map((row, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>{row.errorCode}</TableCell>
                            <TableCell align="right">{row.count.toFixed(0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
              </AdminSectionPanel>
            </Box>

            <Box sx={monitoringPanelGridSx}>
              {/* Request Volume */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.request_rate_req_s')}
                subtitle={t('admin:system_monitoring.request_rate_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="timeFormatted" minTickGap={30} />
                      <YAxis />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend />
                      <Area type="monotone" dataKey="reqRate" name={t("admin:system_monitoring.total_requests")} stroke={theme.palette.primary.main} fill={theme.palette.primary.light} fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>

              {/* Latency */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.latency_ms')}
                subtitle={t('admin:system_monitoring.latency_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="timeFormatted" minTickGap={30} />
                      <YAxis />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('latency', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="latAvg" name={t("admin:system_monitoring.avg_latency")} stroke={theme.palette.success.main} strokeWidth={2} hide={isolatedSeries['latency'] && isolatedSeries['latency'] !== 'latAvg'} />
                      <Line type="monotone" dot={false} dataKey="latP50" name={t("admin:system_monitoring.p50_latency")} stroke={theme.palette.info.main} strokeWidth={2} hide={isolatedSeries['latency'] && isolatedSeries['latency'] !== 'latP50'} />
                      <Line type="monotone" dot={false} dataKey="latP99" name={t("admin:system_monitoring.p99_latency")} stroke={theme.palette.warning.main} strokeWidth={2} hide={isolatedSeries['latency'] && isolatedSeries['latency'] !== 'latP99'} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>

              {/* Error Rate */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.http_error_rate_s')}
                subtitle={t('admin:system_monitoring.http_error_rate_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="timeFormatted" minTickGap={30} />
                      <YAxis />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend />
                      <Area type="monotone" dataKey="errRate" name={t("admin:system_monitoring.http_errors")} stroke={theme.palette.error.main} fill={theme.palette.error.light} fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>

              {/* HTTP Status Breakdown Timeline */}
              {availableStatusCodes.length > 0 && (
                <AdminSectionPanel
                  title={t('admin:system_monitoring.http_status_breakdown')}
                  subtitle={t('admin:system_monitoring.http_status_breakdown_desc')}
                  sx={monitoringPanelSx}
                >
                  <Box sx={monitoringChartBoxSx}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="timeFormatted" minTickGap={30} />
                        <YAxis />
                        <RechartsTooltip content={renderTooltip} />
                        <Legend onClick={(e) => handleLegendClick('status', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                        {availableStatusCodes.map((code, idx) => {
                          const dataKey = `status_${code}`;
                          const isIsolated = isolatedSeries['status'];
                          let color = COLORS[idx % COLORS.length];
                          if (code.startsWith('2')) color = theme.palette.success.main;
                          else if (code.startsWith('3')) color = theme.palette.info.main;
                          else if (code.startsWith('4')) color = theme.palette.warning.main;
                          else if (code.startsWith('5')) color = theme.palette.error.main;

                          return (
                            <Area 
                              key={code} 
                              type="monotone" 
                              dataKey={dataKey} 
                              name={`HTTP ${code}`} 
                              stackId="1"
                              stroke={color} 
                              fill={color} 
                              fillOpacity={0.6} 
                              hide={isIsolated && isIsolated !== dataKey}
                            />
                          );
                        })}
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </AdminSectionPanel>
              )}

              {/* Exceptions Breakdown Timeline */}
              {availableErrorCodes.length > 0 && (
                <AdminSectionPanel
                  title={t('admin:system_monitoring.app_exceptions_timeline')}
                  subtitle={t('admin:system_monitoring.app_exceptions_timeline_desc')}
                  sx={monitoringPanelSx}
                >
                  <Box sx={monitoringChartBoxSx}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="timeFormatted" minTickGap={30} />
                        <YAxis />
                        <RechartsTooltip content={renderTooltip} />
                        <Legend onClick={(e) => handleLegendClick('exceptions', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                        {availableErrorCodes.map((code, idx) => {
                          const dataKey = `err_${code}`;
                          const isIsolated = isolatedSeries['exceptions'];
                          return (
                            <Area 
                              key={code} 
                              type="monotone" 
                              dataKey={dataKey} 
                              name={code} 
                              stackId="1"
                              stroke={COLORS[idx % COLORS.length]} 
                              fill={COLORS[idx % COLORS.length]} 
                              fillOpacity={0.6} 
                              hide={isIsolated && isIsolated !== dataKey}
                            />
                          );
                        })}
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </AdminSectionPanel>
              )}

              {/* CPU Usage */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.cpu_usage_pct')}
                subtitle={t('admin:system_monitoring.cpu_usage_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="timeFormatted" minTickGap={30} />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('cpu', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="cpuSys" name={t("admin:system_monitoring.system_cpu")} stroke="#8884d8" strokeWidth={2} hide={isolatedSeries['cpu'] && isolatedSeries['cpu'] !== 'cpuSys'} />
                      <Line type="monotone" dot={false} dataKey="cpuProc" name={t("admin:system_monitoring.jvm_cpu")} stroke="#82ca9d" strokeWidth={2} hide={isolatedSeries['cpu'] && isolatedSeries['cpu'] !== 'cpuProc'} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>

              {/* Memory Usage */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.memory_usage_mb')}
                subtitle={t('admin:system_monitoring.memory_usage_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="timeFormatted" minTickGap={30} />
                      <YAxis />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend />
                      <Line type="monotone" dot={false} dataKey="memHeap" name={t("admin:system_monitoring.jvm_heap_used")} stroke="#ff7300" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>

              {/* GC Pause Time */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.gc_pause_time_ms')}
                subtitle={t('admin:system_monitoring.gc_pause_time_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="timeFormatted" minTickGap={30} />
                      <YAxis />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend />
                      <Line type="monotone" dot={false} dataKey="gcPause" name={t("admin:system_monitoring.gc_pause_time")} stroke="#9c27b0" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
            </Box>

            {/* JVM Threads */}
            <Card elevation={0} sx={cardSx}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>{t('admin:system_monitoring.jvm_threads', 'JVM Threads')}</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="timeFormatted" minTickGap={30} />
                      <YAxis />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('threads', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="threadsCurrent" name={t("admin:system_monitoring.threads_current", "Current Threads")} stroke={theme.palette.info.main} strokeWidth={2} hide={isolatedSeries['threads'] && isolatedSeries['threads'] !== 'threadsCurrent'} />
                      <Line type="monotone" dot={false} dataKey="threadsDaemon" name={t("admin:system_monitoring.threads_daemon", "Daemon Threads")} stroke={theme.palette.secondary.main} strokeWidth={2} hide={isolatedSeries['threads'] && isolatedSeries['threads'] !== 'threadsDaemon'} />
                      <Line type="monotone" dot={false} dataKey="threadsPeak" name={t("admin:system_monitoring.threads_peak", "Peak Threads")} stroke={theme.palette.error.main} strokeWidth={2} hide={isolatedSeries['threads'] && isolatedSeries['threads'] !== 'threadsPeak'} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* DB Connection Pool */}
            <Card elevation={0} sx={cardSx}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>{t('admin:system_monitoring.db_connections', 'Database Connections (R2DBC)')}</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="timeFormatted" minTickGap={30} />
                      <YAxis />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('db', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Area type="monotone" dataKey="dbActive" name={t("admin:system_monitoring.db_active", "Active")} stackId="1" stroke={theme.palette.success.main} fill={theme.palette.success.light} fillOpacity={0.6} hide={isolatedSeries['db'] && isolatedSeries['db'] !== 'dbActive'} />
                      <Area type="monotone" dataKey="dbIdle" name={t("admin:system_monitoring.db_idle", "Idle")} stackId="1" stroke={theme.palette.info.main} fill={theme.palette.info.light} fillOpacity={0.6} hide={isolatedSeries['db'] && isolatedSeries['db'] !== 'dbIdle'} />
                      <Area type="monotone" dataKey="dbPending" name={t("admin:system_monitoring.db_pending", "Pending")} stackId="1" stroke={theme.palette.warning.main} fill={theme.palette.warning.light} fillOpacity={0.6} hide={isolatedSeries['db'] && isolatedSeries['db'] !== 'dbPending'} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* Data Table */}
            <AdminSectionPanel
              title={t('admin:system_monitoring.detailed_metrics_data')}
              subtitle={t('admin:system_monitoring.detailed_metrics_data_desc')}
              sx={monitoringPanelSx}
            >
                <TableContainer component={Paper} sx={{ ...adminTableContainerSx, maxHeight: 420 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={adminTableHeadCellSx}>{t('admin:system_monitoring.time')}</TableCell>
                        <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.req_rate')}</TableCell>
                        <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.avg_latency_ms')}</TableCell>
                        <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.p50_latency_ms')}</TableCell>
                        <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.p99_latency_ms')}</TableCell>
                        <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.http_errors_s')}</TableCell>
                        <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.app_errors')}</TableCell>
                        <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.sys_cpu_pct')}</TableCell>
                        <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.jvm_cpu_pct')}</TableCell>
                        <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.heap_mb')}</TableCell>
                        <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.gc_pause_ms')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...chartData].reverse().map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>{row.timeFormatted}</TableCell>
                          <TableCell align="right">{row.reqRate?.toFixed(2) || 0}</TableCell>
                          <TableCell align="right">{row.latAvg?.toFixed(2) || 0}</TableCell>
                          <TableCell align="right">{row.latP50?.toFixed(2) || 0}</TableCell>
                          <TableCell align="right">{row.latP99?.toFixed(2) || 0}</TableCell>
                          <TableCell align="right">{row.errRate?.toFixed(2) || 0}</TableCell>
                          <TableCell align="right">{row.appErr?.toFixed(2) || 0}</TableCell>
                          <TableCell align="right">{row.cpuSys?.toFixed(2) || 0}</TableCell>
                          <TableCell align="right">{row.cpuProc?.toFixed(2) || 0}</TableCell>
                          <TableCell align="right">{row.memHeap?.toFixed(2) || 0}</TableCell>
                          <TableCell align="right">{row.gcPause?.toFixed(2) || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
            </AdminSectionPanel>
          </Stack>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default AdminSystemMonitoringPage;
