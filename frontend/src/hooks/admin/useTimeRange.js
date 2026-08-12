import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

// Preset windows for the admin dashboard time-range selector.
// `value` is the dropdown key; `{ amount, unit }` drives the dayjs subtraction.
// (The System Monitoring page uses hour-based presets because it reads Datadog;
// the dashboard shows business data, so it uses day-based windows.)
export const DASHBOARD_TIME_RANGES = [
  { value: '24h', amount: 24, unit: 'hour' },
  { value: '7d', amount: 7, unit: 'day' },
  { value: '30d', amount: 30, unit: 'day' },
  { value: '90d', amount: 90, unit: 'day' },
  { value: 'custom' },
];

// Auto-refresh options (seconds). 0 = off.
export const DASHBOARD_REFRESH_INTERVALS = [0, 30, 60, 300];

// Backend expects LocalDateTime (@DateTimeFormat ISO.DATE_TIME); send wall-clock
// time with no zone so it lines up with the server's own LocalDateTime.now().
export const WIRE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const DEFAULT_PRESET = DASHBOARD_TIME_RANGES.find((r) => r.value === '30d');

/**
 * Shared state for a dashboard-style time-range selector: preset/custom window,
 * auto-refresh interval, and the resolved `{ from, to }` ISO strings to hand to
 * data hooks. Manual/auto refresh bumps `refreshTick`, which re-anchors preset
 * windows to the current clock (so `from`/`to` change and dependents re-fetch).
 */
const useTimeRange = ({ defaultRange = '30d', defaultRefresh = 0 } = {}) => {
  const [timeRange, setTimeRange] = useState(defaultRange);
  const [customStart, setCustomStart] = useState(() => dayjs().subtract(30, 'day'));
  const [customEnd, setCustomEnd] = useState(() => dayjs());
  const [refreshInterval, setRefreshInterval] = useState(defaultRefresh);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick((tick) => tick + 1), []);

  useEffect(() => {
    if (refreshInterval > 0 && timeRange !== 'custom') {
      const id = setInterval(() => setRefreshTick((tick) => tick + 1), refreshInterval * 1000);
      return () => clearInterval(id);
    }
    return undefined;
  }, [refreshInterval, timeRange]);

  const { from, to } = useMemo(() => {
    // refreshTick participates so presets recompute against the current clock.
    void refreshTick;
    if (timeRange === 'custom') {
      return {
        from: customStart ? customStart.format(WIRE_FORMAT) : null,
        to: customEnd ? customEnd.format(WIRE_FORMAT) : null,
      };
    }
    const preset = DASHBOARD_TIME_RANGES.find((r) => r.value === timeRange) || DEFAULT_PRESET;
    const end = dayjs();
    const start = end.subtract(preset.amount, preset.unit);
    return { from: start.format(WIRE_FORMAT), to: end.format(WIRE_FORMAT) };
  }, [timeRange, customStart, customEnd, refreshTick]);

  return {
    timeRange,
    setTimeRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    refreshInterval,
    setRefreshInterval,
    from,
    to,
    refresh,
    refreshTick,
  };
};

export default useTimeRange;
