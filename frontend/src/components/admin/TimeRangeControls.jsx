import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { alpha, IconButton, MenuItem, Stack, TextField, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DASHBOARD_REFRESH_INTERVALS, DASHBOARD_TIME_RANGES } from '../../hooks/admin/useTimeRange';

/**
 * Header controls for a dashboard time-range selector: preset/custom window,
 * auto-refresh interval, and a manual refresh button. Purely presentational —
 * drive it with the state returned by `useTimeRange`.
 */
const TimeRangeControls = ({
  timeRange,
  setTimeRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  refreshInterval,
  setRefreshInterval,
  onRefresh,
  loading = false,
}) => {
  const { t } = useTranslation(['admin']);

  const rangeOptions = useMemo(
    () => DASHBOARD_TIME_RANGES.map((r) => ({
      value: r.value,
      label: r.value === 'custom'
        ? t('admin:dashboard_range.custom_range')
        : t(`admin:dashboard_range.last_${r.value}`),
    })),
    [t],
  );

  const refreshOptions = useMemo(
    () => DASHBOARD_REFRESH_INTERVALS.map((seconds) => ({
      value: seconds,
      label: seconds === 0
        ? t('admin:dashboard_range.off')
        : t(`admin:dashboard_range.${seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}`),
    })),
    [t],
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
        <TextField
          select
          size="small"
          label={t('admin:dashboard_range.time_range')}
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          {rangeOptions.map((r) => (
            <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
          ))}
        </TextField>

        {timeRange === 'custom' && (
          <Stack direction="row" spacing={2}>
            <DateTimePicker
              label={t('admin:dashboard_range.start_date')}
              value={customStart}
              onChange={(newValue) => setCustomStart(newValue)}
              slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
            />
            <DateTimePicker
              label={t('admin:dashboard_range.end_date')}
              value={customEnd}
              onChange={(newValue) => setCustomEnd(newValue)}
              slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
            />
          </Stack>
        )}

        <TextField
          select
          size="small"
          label={t('admin:dashboard_range.auto_refresh')}
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
          disabled={timeRange === 'custom'}
          sx={{ minWidth: 130 }}
        >
          {refreshOptions.map((r) => (
            <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
          ))}
        </TextField>

        <Tooltip title={t('admin:dashboard_range.force_refresh')}>
          <span>
            <IconButton
              size="small"
              onClick={onRefresh}
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
      </Stack>
    </LocalizationProvider>
  );
};

export default TimeRangeControls;
