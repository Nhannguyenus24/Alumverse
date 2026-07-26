import LoadingSkeleton from '../../components/LoadingSkeleton';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router';
import {
  Box,
  Typography,
  MenuItem,
  TextField,
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
  useTheme,
  alpha,
  Card,
  CardContent
} from '@mui/material';
import { useSnackbar } from 'notistack';
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
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import AdminDashboardMetricTile from '../../components/admin/AdminDashboardMetricTile';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';

const PROMETHEUS_BASE = import.meta.env.VITE_PROMETHEUS_URL || '';
const PROMETHEUS_URL_RANGE = `${PROMETHEUS_BASE}/api/v1/query_range`;
const PROMETHEUS_URL_INSTANT = `${PROMETHEUS_BASE}/api/v1/query`;

const QUERIES = {
  requestRate: 'sum(rate(http_endpoint_requests_total[5m]))',
  errorRate: 'sum(rate(http_endpoint_errors_total[5m]))',
  latencyAvg: '(sum(rate(http_endpoint_latency_seconds_sum[5m])) / sum(rate(http_endpoint_latency_seconds_count[5m]))) * 1000',
  latencyP50: 'histogram_quantile(0.50, sum(rate(http_endpoint_latency_seconds_bucket[5m])) by (le)) * 1000',
  latencyP95: 'histogram_quantile(0.95, sum(rate(http_endpoint_latency_seconds_bucket[5m])) by (le)) * 1000',
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
  dbPendingConns: 'sum(r2dbc_pool_pending_connections)',

  // --- Tier 1: custom application I/O metrics (already emitted by backend) ---
  emailLatency: '(sum(rate(email_send_time_seconds_sum[5m])) / sum(rate(email_send_time_seconds_count[5m]))) * 1000',
  ocrLatency: '(sum(rate(ocr_processing_time_seconds_sum[5m])) / sum(rate(ocr_processing_time_seconds_count[5m]))) * 1000',
  imageLatency: '(sum(rate(image_processing_time_seconds_sum[5m])) / sum(rate(image_processing_time_seconds_count[5m]))) * 1000',
  imageLatencyP50: 'histogram_quantile(0.50, sum(rate(image_processing_time_seconds_bucket[5m])) by (le)) * 1000',
  imageLatencyP95: 'histogram_quantile(0.95, sum(rate(image_processing_time_seconds_bucket[5m])) by (le)) * 1000',
  imageLatencyP99: 'histogram_quantile(0.99, sum(rate(image_processing_time_seconds_bucket[5m])) by (le)) * 1000',
  fileUploadLatency: '(sum(rate(file_upload_processing_time_seconds_sum[5m])) / sum(rate(file_upload_processing_time_seconds_count[5m]))) * 1000',
  storageSize: 'sum(image_storage_size_bytes) / 1024 / 1024',

  // --- Tier 2: standard Micrometer / JVM metrics (scraped via enable.all=true) ---
  memoryNonHeap: 'sum(jvm_memory_used_bytes{area="nonheap"}) / 1024 / 1024',
  heapUtilPct: 'sum(jvm_memory_used_bytes{area="heap"}) / sum(jvm_memory_max_bytes{area="heap"}) * 100',
  systemLoad: 'system_load_average_1m',
  cpuCount: 'system_cpu_count',
  gcCount: 'sum(rate(jvm_gc_pause_seconds_count[5m]))',
  fdUsagePct: 'process_files_open_files / process_max_file_descriptors * 100',
  dbSaturationPct: 'sum(r2dbc_pool_acquired_connections) / sum(r2dbc_pool_max_allocated_connections) * 100',

  // --- Tier 3: newly added backend metrics ---
  rateLimitRejected: 'sum(increase(ratelimit_rejected_total[5m]))',
  wsActiveSessions: 'sum(chat_websocket_active_sessions)',
  wsActiveGroups: 'sum(chat_websocket_active_groups)',

  // --- SSE (real-time push) metrics ---
  sseActiveConnections: 'sum(sse_active_connections)',
  sseActiveUsers: 'sum(sse_active_users)',

  // --- AI (LLM) latency metrics ---
  aiLatencyAvg: '(sum(rate(ai_generate_time_seconds_sum[5m])) / sum(rate(ai_generate_time_seconds_count[5m]))) * 1000',
  aiLatencyP50: 'histogram_quantile(0.50, sum(rate(ai_generate_time_seconds_bucket[5m])) by (le)) * 1000',
  aiLatencyP95: 'histogram_quantile(0.95, sum(rate(ai_generate_time_seconds_bucket[5m])) by (le)) * 1000',
  aiLatencyP99: 'histogram_quantile(0.99, sum(rate(ai_generate_time_seconds_bucket[5m])) by (le)) * 1000',
  aiCallRate: 'sum(rate(ai_generate_count_total[5m]))'
};

const buildHuePalette = (count, { baseHue = 210, saturation = 68, lightness = 55 } = {}) => {
  const n = Math.max(count, 1);
  return Array.from({ length: n }, (_, i) => {
    const hue = Math.round((baseHue + (360 / n) * i) % 360);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });
};


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
    md: 'repeat(3, minmax(0, 1fr))',
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


const formatUptime = (totalSeconds) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—';
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const fetchPrometheusRange = async (query, start, end, step) => {
  try {
    const res = await axios.get(PROMETHEUS_URL_RANGE, {
      params: { query, start, end, step: `${step}s` },
      timeout: 60000
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
      timeout: 60000
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
      timeout: 60000
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
  const { setBreadcrumbs } = useOutletContext() || {};
  const theme = useTheme();
  const { t } = useTranslation(['admin']);
  const { enqueueSnackbar } = useSnackbar();

  const chartColors = useMemo(() => buildHuePalette(20, { lightness: theme.palette.mode === 'dark' ? 60 : 52 }), [theme.palette.mode]);
  const axisProps = useMemo(() => ({ tick: { fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 600 }, axisLine: false, tickLine: false, tickMargin: 12 }), [theme.palette.text.secondary]);
  const gridProps = useMemo(() => ({ strokeDasharray: "4 4", stroke: theme.palette.divider, vertical: false }), [theme.palette.divider]);

  const renderDefs = () => (
    <defs>
      <linearGradient id="area-primary" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.45} /><stop offset="60%" stopColor={theme.palette.primary.main} stopOpacity={0.12} /><stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} /></linearGradient>
      <linearGradient id="area-error" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.45} /><stop offset="60%" stopColor={theme.palette.error.main} stopOpacity={0.12} /><stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} /></linearGradient>
      <linearGradient id="area-success" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.45} /><stop offset="60%" stopColor={theme.palette.success.main} stopOpacity={0.12} /><stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} /></linearGradient>
      <linearGradient id="area-info" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.45} /><stop offset="60%" stopColor={theme.palette.info.main} stopOpacity={0.12} /><stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} /></linearGradient>
      <linearGradient id="area-secondary" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.45} /><stop offset="60%" stopColor={theme.palette.secondary.main} stopOpacity={0.12} /><stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} /></linearGradient>
    </defs>
  );

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
  const [chartTicks, setChartTicks] = useState([]);
  const [chartFormat, setChartFormat] = useState('HH:mm');
  const [endpointStats, setEndpointStats] = useState([]);
  const [exceptionStats, setExceptionStats] = useState([]);
  const [summaryStats, setSummaryStats] = useState({ totalRequests: 0, totalErrors: 0, errorRate: 0, avgLatency: 0, uptimeSeconds: 0, onlineUsers: 0 });
  const [availableErrorCodes, setAvailableErrorCodes] = useState([]);
  const [availableStatusCodes, setAvailableStatusCodes] = useState([]);
  const [availableSseEvents, setAvailableSseEvents] = useState([]);
  const [availableEmailTemplates, setAvailableEmailTemplates] = useState([]);
  const [availableCronjobs, setAvailableCronjobs] = useState([]);
  const [isolatedSeries, setIsolatedSeries] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: 'error' });
    }
  }, [error, enqueueSnackbar]);

  useEffect(() => {
    if (setBreadcrumbs) {
      setBreadcrumbs([
        { label: t('admin:system_monitoring.title'), active: true },
      ]);
    }
  }, [setBreadcrumbs, t]);

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

      const formatString = rangeSeconds > 86400 ? 'MM/DD HH:mm' : 'HH:mm';
      setChartFormat(formatString);

      let tickInterval;
      if (rangeSeconds <= 3600) tickInterval = 300; // 5 mins
      else if (rangeSeconds <= 3 * 3600) tickInterval = 900; // 15 mins
      else if (rangeSeconds <= 6 * 3600) tickInterval = 1800; // 30 mins
      else if (rangeSeconds <= 12 * 3600) tickInterval = 3600; // 1 hour
      else if (rangeSeconds <= 24 * 3600) tickInterval = 7200; // 2 hours
      else tickInterval = Math.max(86400, Math.floor(rangeSeconds / 10));
      
      const ticksArr = [];
      const firstTick = start - (start % tickInterval) + (start % tickInterval === 0 ? 0 : tickInterval);
      for (let t = firstTick; t <= end; t += tickInterval) {
        ticksArr.push(t);
      }
      setChartTicks(ticksArr);

      const [
        reqRateData,
        errRateData,
        latAvgData,
        latP50Data,
        latP95Data,
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
        emailLatData,
        ocrLatData,
        imageLatData,
        imageLatP50Data,
        imageLatP95Data,
        imageLatP99Data,
        fileUploadLatData,
        storageSizeData,
        memNonHeapData,
        heapUtilData,
        systemLoadData,
        cpuCountData,
        logErrorsData,
        logWarnsData,
        gcCountData,
        fdUsageData,
        dbSaturationData,
        authLoginSuccessData,
        authLoginFailureData,
        authRefreshSuccessData,
        authRefreshFailureData,
        rateLimitRejectedData,
        wsActiveSessionsData,
        wsActiveGroupsData,
        endpointDataRes,
        exceptionDataRes,
        endpointLatencyRes,
        endpointMaxLatencyRes,
        exceptionTimeSeriesRes,
        statusTimeSeriesRes,
        totalRequestsRes,
        totalErrorsRes,
        currentAvgLatencyRes,
        uptimeRes,
        onlineUsersRes,
        sseActiveConnectionsData,
        sseActiveUsersData,
        sseEventsRateData,
        sseEventsByTypeRes,
        aiLatAvgData,
        aiLatP50Data,
        aiLatP95Data,
        aiLatP99Data,
        aiCallRateData,
        emailByTemplateRes,
        cronjobExecutionsRes,
        cronjobDurationRes
      ] = await Promise.all([
        fetchPrometheusRange(QUERIES.requestRate, start, end, step),
        fetchPrometheusRange(QUERIES.errorRate, start, end, step),
        fetchPrometheusRange(QUERIES.latencyAvg, start, end, step),
        fetchPrometheusRange(QUERIES.latencyP50, start, end, step),
        fetchPrometheusRange(QUERIES.latencyP95, start, end, step),
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
        fetchPrometheusRange(QUERIES.emailLatency, start, end, step),
        fetchPrometheusRange(QUERIES.ocrLatency, start, end, step),
        fetchPrometheusRange(QUERIES.imageLatency, start, end, step),
        fetchPrometheusRange(QUERIES.imageLatencyP50, start, end, step),
        fetchPrometheusRange(QUERIES.imageLatencyP95, start, end, step),
        fetchPrometheusRange(QUERIES.imageLatencyP99, start, end, step),
        fetchPrometheusRange(QUERIES.fileUploadLatency, start, end, step),
        fetchPrometheusRange(QUERIES.storageSize, start, end, step),
        fetchPrometheusRange(QUERIES.memoryNonHeap, start, end, step),
        fetchPrometheusRange(QUERIES.heapUtilPct, start, end, step),
        fetchPrometheusRange(QUERIES.systemLoad, start, end, step),
        fetchPrometheusRange(QUERIES.cpuCount, start, end, step),
        fetchPrometheusRange(`sum(increase(logback_events_total{level="error"}[${step}s]))`, start, end, step),
        fetchPrometheusRange(`sum(increase(logback_events_total{level="warn"}[${step}s]))`, start, end, step),
        fetchPrometheusRange(QUERIES.gcCount, start, end, step),
        fetchPrometheusRange(QUERIES.fdUsagePct, start, end, step),
        fetchPrometheusRange(QUERIES.dbSaturationPct, start, end, step),
        fetchPrometheusRange(`sum(increase(auth_login_total{result="success"}[${step}s]))`, start, end, step),
        fetchPrometheusRange(`sum(increase(auth_login_total{result="failure"}[${step}s]))`, start, end, step),
        fetchPrometheusRange(`sum(increase(auth_token_refresh_total{result="success"}[${step}s]))`, start, end, step),
        fetchPrometheusRange(`sum(increase(auth_token_refresh_total{result="failure"}[${step}s]))`, start, end, step),
        fetchPrometheusRange(QUERIES.rateLimitRejected, start, end, step),
        fetchPrometheusRange(QUERIES.wsActiveSessions, start, end, step),
        fetchPrometheusRange(QUERIES.wsActiveGroups, start, end, step),
        fetchPrometheusInstant(`topk(50, sum by (path, method) (increase(http_endpoint_requests_total[${rangeSeconds}s])))`, end),
        fetchPrometheusInstant(`topk(50, sum by (error_code) (increase(api_errors_count_total[${rangeSeconds}s])))`, end),
        fetchPrometheusInstant(`sum by (path, method) (increase(http_endpoint_latency_seconds_sum[${rangeSeconds}s])) / sum by (path, method) (increase(http_endpoint_latency_seconds_count[${rangeSeconds}s])) * 1000`, end),
        fetchPrometheusInstant(`max by (path, method) (max_over_time(http_endpoint_latency_seconds_max[${rangeSeconds}s])) * 1000`, end),
        fetchPrometheusRangeMultiple(`sum by (error_code) (increase(api_errors_count_total[${step}s]))`, start, end, step),
        fetchPrometheusRangeMultiple(`sum by (status) (rate(http_endpoint_requests_total[5m]))`, start, end, step),
        fetchPrometheusInstant(`sum(http_endpoint_requests_total)`, end),
        fetchPrometheusInstant(`sum(http_endpoint_errors_total)`, end),
        fetchPrometheusInstant(`sum(rate(http_endpoint_latency_seconds_sum[5m])) / sum(rate(http_endpoint_latency_seconds_count[5m])) * 1000`, end),
        fetchPrometheusInstant(`process_uptime_seconds`, end),
        fetchPrometheusInstant(QUERIES.sseActiveUsers, end),
        fetchPrometheusRange(QUERIES.sseActiveConnections, start, end, step),
        fetchPrometheusRange(QUERIES.sseActiveUsers, start, end, step),
        fetchPrometheusRange(`sum(increase(sse_events_sent_total[${step}s]))`, start, end, step),
        fetchPrometheusRangeMultiple(`sum by (event) (increase(sse_events_sent_total[${step}s]))`, start, end, step),
        fetchPrometheusRange(QUERIES.aiLatencyAvg, start, end, step),
        fetchPrometheusRange(QUERIES.aiLatencyP50, start, end, step),
        fetchPrometheusRange(QUERIES.aiLatencyP95, start, end, step),
        fetchPrometheusRange(QUERIES.aiLatencyP99, start, end, step),
        fetchPrometheusRange(QUERIES.aiCallRate, start, end, step),
        fetchPrometheusRangeMultiple(`sum by (template) (increase(email_send_count_total[${step}s]))`, start, end, step),
        fetchPrometheusRangeMultiple(`sum by (job_name) (increase(cronjob_execution_time_seconds_count[${step}s]))`, start, end, step),
        fetchPrometheusRangeMultiple(`sum by (job_name) (increase(cronjob_execution_time_seconds_sum[${step}s])) / sum by (job_name) (increase(cronjob_execution_time_seconds_count[${step}s])) * 1000`, start, end, step)
      ]);

      // Merge time-series data
      const mergedMap = new Map();

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
      processSeries(latP95Data, 'latP95');
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
      // Tier 1: application I/O metrics
      processSeries(emailLatData, 'emailLat');
      processSeries(ocrLatData, 'ocrLat');
      processSeries(imageLatData, 'imageLat');
      processSeries(imageLatP50Data, 'imageLatP50');
      processSeries(imageLatP95Data, 'imageLatP95');
      processSeries(imageLatP99Data, 'imageLatP99');
      processSeries(fileUploadLatData, 'fileUploadLat');
      processSeries(storageSizeData, 'storageSize');
      // Tier 2: JVM / system metrics
      processSeries(memNonHeapData, 'memNonHeap');
      processSeries(heapUtilData, 'heapUtil');
      processSeries(systemLoadData, 'systemLoad');
      processSeries(cpuCountData, 'cpuCount');
      processSeries(logErrorsData, 'logErrors');
      processSeries(logWarnsData, 'logWarns');
      processSeries(gcCountData, 'gcCount');
      processSeries(fdUsageData, 'fdUsage');
      processSeries(dbSaturationData, 'dbSaturation');
      // Tier 3: newly added backend metrics
      processSeries(authLoginSuccessData, 'authLoginSuccess');
      processSeries(authLoginFailureData, 'authLoginFailure');
      processSeries(authRefreshSuccessData, 'authRefreshSuccess');
      processSeries(authRefreshFailureData, 'authRefreshFailure');
      processSeries(rateLimitRejectedData, 'rateLimitRejected');
      processSeries(wsActiveSessionsData, 'wsActiveSessions');
      processSeries(wsActiveGroupsData, 'wsActiveGroups');
      // SSE real-time push metrics
      processSeries(sseActiveConnectionsData, 'sseActiveConnections');
      processSeries(sseActiveUsersData, 'sseActiveUsers');
      processSeries(sseEventsRateData, 'sseEventsRate');
      // AI (LLM) latency metrics
      processSeries(aiLatAvgData, 'aiLatAvg');
      processSeries(aiLatP50Data, 'aiLatP50');
      processSeries(aiLatP95Data, 'aiLatP95');
      processSeries(aiLatP99Data, 'aiLatP99');
      processSeries(aiCallRateData, 'aiCallRate');

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

      // SSE events broken down by type (feature-toggled, verification-updated, user-banned, new-message, connected)
      const sseEventsSet = new Set();
      if (sseEventsByTypeRes) {
        sseEventsByTypeRes.forEach(seriesObj => {
          const eventName = seriesObj.metric.event || 'UNKNOWN';
          const key = `sse_evt_${eventName}`;
          sseEventsSet.add(eventName);

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
      setAvailableSseEvents(Array.from(sseEventsSet));

      // Email sends broken down by template code (OTP_EMAIL_TEMPLATE, eventReminder, raw, ...)
      const emailTemplatesSet = new Set();
      if (emailByTemplateRes) {
        emailByTemplateRes.forEach(seriesObj => {
          const templateName = seriesObj.metric.template || 'UNKNOWN';
          const key = `email_tpl_${templateName}`;
          emailTemplatesSet.add(templateName);

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
      setAvailableEmailTemplates(Array.from(emailTemplatesSet));

      const cronjobsSet = new Set();
      if (cronjobExecutionsRes) {
        cronjobExecutionsRes.forEach(seriesObj => {
          const jobName = seriesObj.metric.job_name || 'UNKNOWN';
          const key = `cron_exec_${jobName}`;
          cronjobsSet.add(jobName);

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
      if (cronjobDurationRes) {
        cronjobDurationRes.forEach(seriesObj => {
          const jobName = seriesObj.metric.job_name || 'UNKNOWN';
          const key = `cron_dur_${jobName}`;
          cronjobsSet.add(jobName);

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
      setAvailableCronjobs(Array.from(cronjobsSet));

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

      const maxLatencyMap = new Map();
      if (endpointMaxLatencyRes && endpointMaxLatencyRes.length > 0) {
        endpointMaxLatencyRes.forEach(res => {
          const key = `${res.metric.method || 'UNKNOWN'}-${res.metric.path || 'Unknown'}`;
          let val = parseFloat(res.value[1]);
          if (isNaN(val)) val = 0;
          maxLatencyMap.set(key, val);
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
              avgLatency: latencyMap.get(key) || 0,
              maxLatency: maxLatencyMap.get(key) || 0
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
      const uptimeSec = uptimeRes.length > 0 ? parseFloat(uptimeRes[0].value[1]) : 0;
      const onlineUsersNow = onlineUsersRes.length > 0 ? parseFloat(onlineUsersRes[0].value[1]) : 0;

      setSummaryStats({
        totalRequests: totalReq,
        totalErrors: totalErr,
        errorRate: totalReq > 0 ? (totalErr / totalReq) * 100 : 0,
        avgLatency: curAvgLat,
        uptimeSeconds: uptimeSec,
        onlineUsers: Number.isFinite(onlineUsersNow) ? onlineUsersNow : 0
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
      const formattedLabel = (typeof label === 'number' || !isNaN(Number(label)))
        ? dayjs(Number(label) * 1000).format('YYYY-MM-DD HH:mm:ss')
        : label;

      return (
        <Box sx={{ bgcolor: 'background.paper', p: 1.5, border: '1px solid #ccc', borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="body2" color="text.secondary" mb={1}>{formattedLabel}</Typography>
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
            <TextField
              select
              size="small"
              label={t('admin:system_monitoring.time_range')}
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              {TIME_RANGES.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </TextField>

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

            <TextField
              select
              size="small"
              label={t('admin:system_monitoring.auto_refresh')}
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
              disabled={timeRange === 'custom'}
              sx={{ minWidth: 120 }}
            >
              {REFRESH_INTERVALS.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </TextField>
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
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Box sx={{ mb: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {loading && chartData.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <LoadingSkeleton />
          </Box>
        )}

        {chartData.length > 0 && (
          <Stack spacing={3}>

            {/* --- SECTION: HỆ THỐNG --- */}
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 2, mb: 1, color: 'primary.main', borderBottom: '2px solid', borderColor: 'divider', pb: 1 }}>
              Hệ thống
            </Typography>
            {/* Summary Stats */}
            <Stack spacing={3}>
              <Box sx={monitoringMetricGridSx}>
                <AdminDashboardMetricTile
                  label={t('admin:system_monitoring.online_users_now', 'Online Users Now')}
                  value={Math.round(summaryStats.onlineUsers).toLocaleString()}
                  icon={<PeopleAltOutlinedIcon />}
                  sx={{ flex: 'unset', borderRadius: 2.5 }}
                />
                <AdminDashboardMetricTile
                  label={t('admin:system_monitoring.total_requests_all_time')}
                  value={summaryStats.totalRequests.toLocaleString()}
                  icon={<QueryStatsOutlinedIcon />}
                  sx={{ flex: 'unset', borderRadius: 2.5 }}
                />
                <AdminDashboardMetricTile
                  label={t('admin:system_monitoring.avg_latency_5m')}
                  value={`${Number.isFinite(summaryStats.avgLatency) ? summaryStats.avgLatency.toFixed(2) : '0.00'} ms`}
                  icon={<TimerOutlinedIcon />}
                  sx={{ flex: 'unset', borderRadius: 2.5 }}
                />
              </Box>
              <Box sx={monitoringMetricGridSx}>
                <AdminDashboardMetricTile
                  label={t('admin:system_monitoring.uptime')}
                  value={formatUptime(summaryStats.uptimeSeconds)}
                  icon={<AccessTimeOutlinedIcon />}
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
              </Box>
            </Stack>

            <Box sx={monitoringPanelGridSx}>
              {/* CPU Usage */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.cpu_usage_pct')}
                subtitle={t('admin:system_monitoring.cpu_usage_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis domain={[0, 100]} {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('cpu', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="cpuSys" name={t("admin:system_monitoring.system_cpu")} stroke={chartColors[0]} strokeWidth={2.5} hide={isolatedSeries['cpu'] && isolatedSeries['cpu'] !== 'cpuSys'} />
                      <Line type="monotone" dot={false} dataKey="cpuProc" name={t("admin:system_monitoring.jvm_cpu")} stroke={chartColors[1]} strokeWidth={2.5} hide={isolatedSeries['cpu'] && isolatedSeries['cpu'] !== 'cpuProc'} />
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
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('memory', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="memHeap" name={t("admin:system_monitoring.jvm_heap_used")} stroke={chartColors[3]} strokeWidth={2.5} hide={isolatedSeries['memory'] && isolatedSeries['memory'] !== 'memHeap'} />
                      <Line type="monotone" dot={false} dataKey="memNonHeap" name={t("admin:system_monitoring.jvm_nonheap_used")} stroke={chartColors[4]} strokeWidth={2.5} hide={isolatedSeries['memory'] && isolatedSeries['memory'] !== 'memNonHeap'} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
            </Box>
            <Box sx={monitoringPanelGridSx}>
              {/* GC Pause Time */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.gc_pause_time_ms')}
                subtitle={t('admin:system_monitoring.gc_pause_time_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend />
                      <Line type="monotone" dot={false} dataKey="gcPause" name={t("admin:system_monitoring.gc_pause_time")} stroke={chartColors[5]} strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
              {/* GC Collections Rate (Tier 2) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.gc_collections')}
                subtitle={t('admin:system_monitoring.gc_collections_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend />
                      <Line type="monotone" dot={false} dataKey="gcCount" name={t("admin:system_monitoring.gc_collections")} stroke={chartColors[6]} strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
            </Box>
            <Box sx={monitoringPanelGridSx}>
              {/* Resource Utilization % (Tier 2) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.resource_utilization')}
                subtitle={t('admin:system_monitoring.resource_utilization_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis domain={[0, 100]} {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('util', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="heapUtil" name={t("admin:system_monitoring.heap_utilization")} stroke={theme.palette.error.main} strokeWidth={2.5} hide={isolatedSeries['util'] && isolatedSeries['util'] !== 'heapUtil'} />
                      <Line type="monotone" dot={false} dataKey="fdUsage" name={t("admin:system_monitoring.fd_usage")} stroke={theme.palette.warning.main} strokeWidth={2.5} hide={isolatedSeries['util'] && isolatedSeries['util'] !== 'fdUsage'} />
                      <Line type="monotone" dot={false} dataKey="dbSaturation" name={t("admin:system_monitoring.db_saturation")} stroke={theme.palette.info.main} strokeWidth={2.5} hide={isolatedSeries['util'] && isolatedSeries['util'] !== 'dbSaturation'} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
              {/* System Load Average (Tier 2) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.system_load')}
                subtitle={t('admin:system_monitoring.system_load_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('load', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="systemLoad" name={t("admin:system_monitoring.load_1m")} stroke={theme.palette.primary.main} strokeWidth={2.5} hide={isolatedSeries['load'] && isolatedSeries['load'] !== 'systemLoad'} />
                      <Line type="monotone" dot={false} dataKey="cpuCount" name={t("admin:system_monitoring.cpu_count")} stroke={theme.palette.text.secondary} strokeWidth={1} strokeDasharray="4 4" hide={isolatedSeries['load'] && isolatedSeries['load'] !== 'cpuCount'} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
            </Box>
            <Box sx={monitoringPanelGridSx}>
            {/* JVM Threads */}
            <Card elevation={0} sx={cardSx}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>{t('admin:system_monitoring.jvm_threads', 'JVM Threads')}</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('threads', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="threadsCurrent" name={t("admin:system_monitoring.threads_current", "Current Threads")} stroke={theme.palette.info.main} strokeWidth={2.5} hide={isolatedSeries['threads'] && isolatedSeries['threads'] !== 'threadsCurrent'} />
                      <Line type="monotone" dot={false} dataKey="threadsDaemon" name={t("admin:system_monitoring.threads_daemon", "Daemon Threads")} stroke={theme.palette.secondary.main} strokeWidth={2.5} hide={isolatedSeries['threads'] && isolatedSeries['threads'] !== 'threadsDaemon'} />
                      <Line type="monotone" dot={false} dataKey="threadsPeak" name={t("admin:system_monitoring.threads_peak", "Peak Threads")} stroke={theme.palette.error.main} strokeWidth={2.5} hide={isolatedSeries['threads'] && isolatedSeries['threads'] !== 'threadsPeak'} />
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
                    <AreaChart data={chartData}>{renderDefs()}
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
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
            </Box>
            <Box sx={monitoringPanelGridSx}>
              {/* Storage Size (Tier 1) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.storage_size')}
                subtitle={t('admin:system_monitoring.storage_size_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>{renderDefs()}
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend />
                      <Area type="monotone" dataKey="storageSize" name={t("admin:system_monitoring.storage_size_mb")} stroke={theme.palette.success.main} fill="url(#area-success)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
            </Box>
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

            {/* --- SECTION: API --- */}
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 4, mb: 1, color: 'primary.main', borderBottom: '2px solid', borderColor: 'divider', pb: 1 }}>
              API
            </Typography>
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
                          <TableCell align="right" sx={adminTableHeadCellSx}>{t('admin:system_monitoring.max_latency_ms', 'Max Latency (ms)')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {endpointStats.length === 0 && (
                          <TableRow><TableCell colSpan={5} align="center">{t('admin:system_monitoring.no_data')}</TableCell></TableRow>
                        )}
                        {endpointStats.map((row, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontWeight: 'bold' }}>{row.method}</TableCell>
                            <TableCell>{row.path}</TableCell>
                            <TableCell align="right">{row.count.toFixed(0)}</TableCell>
                            <TableCell align="right">{row.avgLatency.toFixed(2)}</TableCell>
                            <TableCell align="right">{row.maxLatency.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
              </AdminSectionPanel>
              {/* Request Volume */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.request_rate_req_s')}
                subtitle={t('admin:system_monitoring.request_rate_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>{renderDefs()}
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend />
                      <Area type="monotone" dataKey="reqRate" name={t("admin:system_monitoring.total_requests")} stroke={theme.palette.primary.main} fill="url(#area-primary)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
            </Box>
            <Box sx={monitoringPanelGridSx}>
              {/* Latency */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.latency_ms')}
                subtitle={t('admin:system_monitoring.latency_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('latency', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="latAvg" name={t("admin:system_monitoring.avg_latency")} stroke={theme.palette.success.main} strokeWidth={2.5} hide={isolatedSeries['latency'] && isolatedSeries['latency'] !== 'latAvg'} />
                      <Line type="monotone" dot={false} dataKey="latP50" name={t("admin:system_monitoring.p50_latency")} stroke={theme.palette.info.main} strokeWidth={2.5} hide={isolatedSeries['latency'] && isolatedSeries['latency'] !== 'latP50'} />
                      <Line type="monotone" dot={false} dataKey="latP95" name={t("admin:system_monitoring.p95_latency")} stroke={theme.palette.secondary.main} strokeWidth={2.5} hide={isolatedSeries['latency'] && isolatedSeries['latency'] !== 'latP95'} />
                      <Line type="monotone" dot={false} dataKey="latP99" name={t("admin:system_monitoring.p99_latency")} stroke={theme.palette.warning.main} strokeWidth={2.5} hide={isolatedSeries['latency'] && isolatedSeries['latency'] !== 'latP99'} />
                    </LineChart>
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
                      <AreaChart data={chartData}>{renderDefs()}
                        <CartesianGrid {...gridProps} />
                        <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                        <YAxis {...axisProps} width={45} />
                        <RechartsTooltip content={renderTooltip} />
                        <Legend onClick={(e) => handleLegendClick('status', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                        {availableStatusCodes.map((code, idx) => {
                          const dataKey = `status_${code}`;
                          const isIsolated = isolatedSeries['status'];
                          let color = chartColors[idx % chartColors.length];
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
            </Box>
            <Box sx={monitoringPanelGridSx}>
              {/* Rate Limit Rejections (Tier 3) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.ratelimit_rejections')}
                subtitle={t('admin:system_monitoring.ratelimit_rejections_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>{renderDefs()}
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend />
                      <Area type="monotone" dataKey="rateLimitRejected" name={t("admin:system_monitoring.ratelimit_rejected")} stroke={theme.palette.error.main} fill="url(#area-error)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
              {/* Active WebSocket Connections (Tier 3) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.websocket_connections')}
                subtitle={t('admin:system_monitoring.websocket_connections_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>{renderDefs()}
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('ws', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Area type="monotone" dataKey="wsActiveSessions" name={t("admin:system_monitoring.ws_sessions")} stroke={theme.palette.primary.main} fill="url(#area-primary)" strokeWidth={2.5} hide={isolatedSeries['ws'] && isolatedSeries['ws'] !== 'wsActiveSessions'} />
                      <Area type="monotone" dataKey="wsActiveGroups" name={t("admin:system_monitoring.ws_groups")} stroke={theme.palette.secondary.main} fill="url(#area-secondary)" strokeWidth={2.5} hide={isolatedSeries['ws'] && isolatedSeries['ws'] !== 'wsActiveGroups'} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
            </Box>
            <Box sx={monitoringPanelGridSx}>
              {/* Active SSE Connections (real-time push) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.sse_connections', 'SSE Connections')}
                subtitle={t('admin:system_monitoring.sse_connections_desc', 'Currently open Server-Sent Events streams and distinct connected users')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>{renderDefs()}
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis allowDecimals={false} {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('sse', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Area type="monotone" dataKey="sseActiveConnections" name={t("admin:system_monitoring.sse_active_connections", "Active Connections")} stroke={theme.palette.primary.main} fill="url(#area-primary)" strokeWidth={2.5} hide={isolatedSeries['sse'] && isolatedSeries['sse'] !== 'sseActiveConnections'} />
                      <Area type="monotone" dataKey="sseActiveUsers" name={t("admin:system_monitoring.sse_active_users", "Active Users")} stroke={theme.palette.info.main} fill="url(#area-info)" strokeWidth={2.5} hide={isolatedSeries['sse'] && isolatedSeries['sse'] !== 'sseActiveUsers'} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
              {/* SSE Events Pushed by type (feature-toggled / verification / ban / new-message) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.sse_events', 'Total SSE Events Pushed')}
                subtitle={t('admin:system_monitoring.sse_events_desc', 'Total real-time events pushed to clients, broken down by type')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>{renderDefs()}
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('sseEvents', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      {availableSseEvents.length === 0 && (
                        <Area type="monotone" dataKey="sseEventsRate" name={t("admin:system_monitoring.sse_events_total", "Total Events")} stroke={theme.palette.success.main} fill="url(#area-success)" strokeWidth={2.5} />
                      )}
                      {availableSseEvents.map((eventName, idx) => {
                        const dataKey = `sse_evt_${eventName}`;
                        const isIsolated = isolatedSeries['sseEvents'];
                        const color = chartColors[idx % chartColors.length];
                        return (
                          <Area
                            key={eventName}
                            type="monotone"
                            dataKey={dataKey}
                            name={eventName}
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
            </Box>

            {/* --- SECTION: CÁC LỖI --- */}
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 4, mb: 1, color: 'primary.main', borderBottom: '2px solid', borderColor: 'divider', pb: 1 }}>
              Các lỗi
            </Typography>
            <Box sx={monitoringPanelGridSx}>
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
              {/* Error Rate */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.http_error_rate_s')}
                subtitle={t('admin:system_monitoring.http_error_rate_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>{renderDefs()}
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend />
                      <Area type="monotone" dataKey="errRate" name={t("admin:system_monitoring.http_errors")} stroke={theme.palette.error.main} fill="url(#area-error)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
            </Box>
            <Box sx={monitoringPanelGridSx}>
              {/* Exceptions Breakdown Timeline */}
              {availableErrorCodes.length > 0 && (
                <AdminSectionPanel
                  title={t('admin:system_monitoring.app_exceptions_timeline')}
                  subtitle={t('admin:system_monitoring.app_exceptions_timeline_desc')}
                  sx={monitoringPanelSx}
                >
                  <Box sx={monitoringChartBoxSx}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>{renderDefs()}
                        <CartesianGrid {...gridProps} />
                        <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                        <YAxis {...axisProps} width={45} />
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
                              stroke={chartColors[idx % chartColors.length]} 
                              fill={chartColors[idx % chartColors.length]} 
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
              {/* Log Events Rate (Tier 2) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.log_events')}
                subtitle={t('admin:system_monitoring.log_events_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>{renderDefs()}
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('logs', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Area type="monotone" dataKey="logWarns" name={t("admin:system_monitoring.log_warn")} stackId="1" stroke={theme.palette.warning.main} fill={theme.palette.warning.light} fillOpacity={0.5} hide={isolatedSeries['logs'] && isolatedSeries['logs'] !== 'logWarns'} />
                      <Area type="monotone" dataKey="logErrors" name={t("admin:system_monitoring.log_error")} stackId="1" stroke={theme.palette.error.main} fill={theme.palette.error.light} fillOpacity={0.5} hide={isolatedSeries['logs'] && isolatedSeries['logs'] !== 'logErrors'} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
            </Box>

            {/* --- SECTION: CÁC CHỨC NĂNG ĐẶC BIỆT --- */}
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 4, mb: 1, color: 'primary.main', borderBottom: '2px solid', borderColor: 'divider', pb: 1 }}>
              Các chức năng đặc biệt
            </Typography>
            <Box sx={monitoringPanelGridSx}>
              {/* Authentication Events (Tier 3) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.auth_events')}
                subtitle={t('admin:system_monitoring.auth_events_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('auth', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="authLoginSuccess" name={t("admin:system_monitoring.login_success")} stroke={theme.palette.success.main} strokeWidth={2.5} hide={isolatedSeries['auth'] && isolatedSeries['auth'] !== 'authLoginSuccess'} />
                      <Line type="monotone" dot={false} dataKey="authLoginFailure" name={t("admin:system_monitoring.login_failure")} stroke={theme.palette.error.main} strokeWidth={2.5} hide={isolatedSeries['auth'] && isolatedSeries['auth'] !== 'authLoginFailure'} />
                      <Line type="monotone" dot={false} dataKey="authRefreshSuccess" name={t("admin:system_monitoring.refresh_success")} stroke={theme.palette.info.main} strokeWidth={2.5} hide={isolatedSeries['auth'] && isolatedSeries['auth'] !== 'authRefreshSuccess'} />
                      <Line type="monotone" dot={false} dataKey="authRefreshFailure" name={t("admin:system_monitoring.refresh_failure")} stroke={theme.palette.warning.main} strokeWidth={2.5} hide={isolatedSeries['auth'] && isolatedSeries['auth'] !== 'authRefreshFailure'} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
              {/* Background I/O Latency (Tier 1) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.io_latency')}
                subtitle={t('admin:system_monitoring.io_latency_desc')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('io', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="emailLat" name={t("admin:system_monitoring.email_latency")} stroke={chartColors[0]} strokeWidth={2.5} hide={isolatedSeries['io'] && isolatedSeries['io'] !== 'emailLat'} />
                      <Line type="monotone" dot={false} dataKey="ocrLat" name={t("admin:system_monitoring.ocr_latency")} stroke={chartColors[1]} strokeWidth={2.5} hide={isolatedSeries['io'] && isolatedSeries['io'] !== 'ocrLat'} />
                      <Line type="monotone" dot={false} dataKey="imageLat" name={t("admin:system_monitoring.image_latency")} stroke={chartColors[2]} strokeWidth={2.5} hide={isolatedSeries['io'] && isolatedSeries['io'] !== 'imageLat'} />
                      <Line type="monotone" dot={false} dataKey="fileUploadLat" name={t("admin:system_monitoring.file_upload_latency")} stroke={chartColors[3]} strokeWidth={2.5} hide={isolatedSeries['io'] && isolatedSeries['io'] !== 'fileUploadLat'} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
            </Box>
            <Box sx={monitoringPanelGridSx}>
              {/* Image Processing Time (Tier 1) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.image_processing_time', 'Image Processing Time (ms)')}
                subtitle={t('admin:system_monitoring.image_processing_time_desc', 'Latency of image decode, resize and WebP conversion.')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('imageLatency', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="imageLat" name={t("admin:system_monitoring.avg_latency")} stroke={theme.palette.success.main} strokeWidth={2.5} hide={isolatedSeries['imageLatency'] && isolatedSeries['imageLatency'] !== 'imageLat'} />
                      <Line type="monotone" dot={false} dataKey="imageLatP50" name={t("admin:system_monitoring.p50_latency")} stroke={theme.palette.info.main} strokeWidth={2.5} hide={isolatedSeries['imageLatency'] && isolatedSeries['imageLatency'] !== 'imageLatP50'} />
                      <Line type="monotone" dot={false} dataKey="imageLatP95" name={t("admin:system_monitoring.p95_latency")} stroke={theme.palette.secondary.main} strokeWidth={2.5} hide={isolatedSeries['imageLatency'] && isolatedSeries['imageLatency'] !== 'imageLatP95'} />
                      <Line type="monotone" dot={false} dataKey="imageLatP99" name={t("admin:system_monitoring.p99_latency")} stroke={theme.palette.warning.main} strokeWidth={2.5} hide={isolatedSeries['imageLatency'] && isolatedSeries['imageLatency'] !== 'imageLatP99'} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
              {/* AI Service Latency (LLM generate calls) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.ai_latency', 'AI Service Latency (ms)')}
                subtitle={t('admin:system_monitoring.ai_latency_desc', 'Latency of LLM generate calls (moderation, extraction, insights, vision)')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('aiLatency', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      <Line type="monotone" dot={false} dataKey="aiLatAvg" name={t("admin:system_monitoring.avg_latency")} stroke={theme.palette.success.main} strokeWidth={2.5} hide={isolatedSeries['aiLatency'] && isolatedSeries['aiLatency'] !== 'aiLatAvg'} />
                      <Line type="monotone" dot={false} dataKey="aiLatP50" name={t("admin:system_monitoring.p50_latency")} stroke={theme.palette.info.main} strokeWidth={2.5} hide={isolatedSeries['aiLatency'] && isolatedSeries['aiLatency'] !== 'aiLatP50'} />
                      <Line type="monotone" dot={false} dataKey="aiLatP95" name={t("admin:system_monitoring.p95_latency")} stroke={theme.palette.secondary.main} strokeWidth={2.5} hide={isolatedSeries['aiLatency'] && isolatedSeries['aiLatency'] !== 'aiLatP95'} />
                      <Line type="monotone" dot={false} dataKey="aiLatP99" name={t("admin:system_monitoring.p99_latency")} stroke={theme.palette.warning.main} strokeWidth={2.5} hide={isolatedSeries['aiLatency'] && isolatedSeries['aiLatency'] !== 'aiLatP99'} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </AdminSectionPanel>
            </Box>
            <Box sx={monitoringPanelGridSx}>
              {/* Email Sends by Template (per-template counter rate) */}
              <AdminSectionPanel
                title={t('admin:system_monitoring.email_by_template', 'Email Sends by Template')}
                subtitle={t('admin:system_monitoring.email_by_template_desc', 'Count of emails sent, broken down by template code')}
                sx={monitoringPanelSx}
              >
                <Box sx={monitoringChartBoxSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>{renderDefs()}
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(unix) => dayjs(unix * 1000).format(chartFormat)} {...axisProps} />
                      <YAxis {...axisProps} width={45} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend onClick={(e) => handleLegendClick('emailTemplates', e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                      {availableEmailTemplates.length === 0 && (
                        <Area type="monotone" dataKey="__none__" name={t("admin:system_monitoring.no_data")} stroke={theme.palette.success.main} fill="url(#area-success)" strokeWidth={2.5} />
                      )}
                      {availableEmailTemplates.map((templateName, idx) => {
                        const dataKey = `email_tpl_${templateName}`;
                        const isIsolated = isolatedSeries['emailTemplates'];
                        const color = chartColors[idx % chartColors.length];
                        return (
                          <Area
                            key={templateName}
                            type="monotone"
                            dataKey={dataKey}
                            name={templateName}
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
            </Box>
            <AdminSectionPanel title="Cronjobs Execution Monitoring" icon={<TimerOutlinedIcon />} defaultExpanded>
              <Box sx={monitoringPanelGridSx}>
                <Card sx={cardSx}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 700, mb: 2 }}>Execution Count by Job</Typography>
                    <Box sx={monitoringChartBoxSx}>
                      {availableCronjobs.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                            {renderDefs()}
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(t) => dayjs(t * 1000).format(chartFormat)} {...axisProps} />
                            <YAxis {...axisProps} />
                            <RechartsTooltip content={renderTooltip} />
                            <Legend wrapperStyle={{ fontSize: 12 }} onClick={(e) => handleLegendClick('cron_exec', e.dataKey)} />
                            {availableCronjobs.map((jobName, idx) => {
                              const dataKey = `cron_exec_${jobName}`;
                              const isHidden = isolatedSeries['cron_exec'] && isolatedSeries['cron_exec'] !== dataKey;
                              return (
                                <Line key={jobName} type="monotone" dataKey={dataKey} name={jobName} stroke={isHidden ? theme.palette.action.disabled : chartColors[idx % chartColors.length]} strokeWidth={isHidden ? 1 : 2} dot={false} isAnimationActive={false} />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No cronjob data</Typography></Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
                <Card sx={cardSx}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 700, mb: 2 }}>Average Duration (ms) by Job</Typography>
                    <Box sx={monitoringChartBoxSx}>
                      {availableCronjobs.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                            {renderDefs()}
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={chartTicks} tickFormatter={(t) => dayjs(t * 1000).format(chartFormat)} {...axisProps} />
                            <YAxis {...axisProps} />
                            <RechartsTooltip content={renderTooltip} />
                            <Legend wrapperStyle={{ fontSize: 12 }} onClick={(e) => handleLegendClick('cron_dur', e.dataKey)} />
                            {availableCronjobs.map((jobName, idx) => {
                              const dataKey = `cron_dur_${jobName}`;
                              const isHidden = isolatedSeries['cron_dur'] && isolatedSeries['cron_dur'] !== dataKey;
                              return (
                                <Line key={jobName} type="monotone" dataKey={dataKey} name={jobName} stroke={isHidden ? theme.palette.action.disabled : chartColors[(idx + 5) % chartColors.length]} strokeWidth={isHidden ? 1 : 2} dot={false} isAnimationActive={false} />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No cronjob data</Typography></Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </AdminSectionPanel>
          </Stack>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default AdminSystemMonitoringPage;
