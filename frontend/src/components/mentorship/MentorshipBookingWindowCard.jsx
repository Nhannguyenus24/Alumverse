import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const RANGE_TYPE_CURRENT = 'CURRENT';
const RANGE_TYPE_DATES = 'DATES';

const MAX_UNITS = [
  { value: 'days', label: 'ngày' },
  { value: 'weeks', label: 'tuần' },
  { value: 'months', label: 'tháng' },
];

const MIN_UNITS = [
  { value: 'hours', label: 'giờ' },
  { value: 'days', label: 'ngày' },
];

const parseInitial = (raw) => {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (_e) {
    return null;
  }
};

const MentorshipBookingWindowCard = ({
  defaultExpanded = false,
  initialSettings = null,
  onSave,
  saving = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const initial = parseInitial(initialSettings);

  const [rangeType, setRangeType] = useState(initial?.rangeType ?? RANGE_TYPE_CURRENT);
  const [startDate, setStartDate] = useState(initial?.startDate ? dayjs(initial.startDate) : null);
  const [endDate, setEndDate] = useState(initial?.endDate ? dayjs(initial.endDate) : null);

  const [maxEnabled, setMaxEnabled] = useState(initial?.maxLeadTime != null);
  const [maxValue, setMaxValue] = useState(initial?.maxLeadTime?.value ?? 60);
  const [maxUnit, setMaxUnit] = useState(initial?.maxLeadTime?.unit ?? 'days');

  const [minEnabled, setMinEnabled] = useState(initial?.minLeadTime != null);
  const [minValue, setMinValue] = useState(initial?.minLeadTime?.value ?? 4);
  const [minUnit, setMinUnit] = useState(initial?.minLeadTime?.unit ?? 'hours');

  // Re-hydrate when initialSettings arrives later (async profile load)
  useEffect(() => {
    const next = parseInitial(initialSettings);
    if (!next) return;
    if (next.rangeType) setRangeType(next.rangeType);
    if (next.startDate) setStartDate(dayjs(next.startDate));
    if (next.endDate) setEndDate(dayjs(next.endDate));
    if (next.maxLeadTime) {
      setMaxEnabled(true);
      setMaxValue(next.maxLeadTime.value ?? 60);
      setMaxUnit(next.maxLeadTime.unit ?? 'days');
    } else {
      setMaxEnabled(false);
    }
    if (next.minLeadTime) {
      setMinEnabled(true);
      setMinValue(next.minLeadTime.value ?? 4);
      setMinUnit(next.minLeadTime.unit ?? 'hours');
    } else {
      setMinEnabled(false);
    }
  }, [initialSettings]);

  const handleSave = () => {
    const payload = {
      rangeType,
      startDate: rangeType === RANGE_TYPE_DATES ? startDate?.toISOString() ?? null : null,
      endDate: rangeType === RANGE_TYPE_DATES ? endDate?.toISOString() ?? null : null,
      maxLeadTime: maxEnabled ? { value: maxValue, unit: maxUnit } : null,
      minLeadTime: minEnabled ? { value: minValue, unit: minUnit } : null,
    };
    if (onSave) onSave(JSON.stringify(payload));
  };

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <SwapHorizIcon color="action" fontSize="small" />
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={700} variant="subtitle1">
            Phạm vi thời gian đặt lịch
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Giới hạn phạm vi thời gian có thể đặt cuộc hẹn
          </Typography>
        </Box>
        <IconButton size="small" aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}>
          {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>

      {expanded && (
        <Box sx={{ px: 3, pb: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2.5}>
              {/* RANGE TYPE */}
              <RadioGroup value={rangeType} onChange={(e) => setRangeType(e.target.value)}>
                <FormControlLabel
                  value={RANGE_TYPE_CURRENT}
                  control={<Radio />}
                  label={<Typography variant="body2">Hiện có</Typography>}
                />
                <FormControlLabel
                  value={RANGE_TYPE_DATES}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2">Ngày bắt đầu và ngày kết thúc</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Giới hạn phạm vi ngày cho tất cả cuộc hẹn
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>

              {rangeType === RANGE_TYPE_DATES && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <DatePicker
                    label="Bắt đầu"
                    value={startDate}
                    onChange={setStartDate}
                    minDate={dayjs()}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <DatePicker
                    label="Kết thúc"
                    value={endDate}
                    onChange={setEndDate}
                    minDate={startDate ?? dayjs()}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Stack>
              )}

              {/* MAX LEAD TIME */}
              <Box>
                <Typography variant="body2" mb={0.5}>
                  Thời gian tối đa có thể đặt trước cuộc hẹn
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Checkbox
                    size="small"
                    checked={maxEnabled}
                    onChange={(e) => setMaxEnabled(e.target.checked)}
                  />
                  <TextField
                    size="small"
                    type="number"
                    value={maxValue}
                    onChange={(e) => setMaxValue(Math.max(1, Number(e.target.value) || 1))}
                    disabled={!maxEnabled}
                    sx={{ width: 90 }}
                    inputProps={{ min: 1 }}
                  />
                  <TextField
                    select
                    size="small"
                    value={maxUnit}
                    onChange={(e) => setMaxUnit(e.target.value)}
                    disabled={!maxEnabled}
                    sx={{ width: 100 }}
                  >
                    {MAX_UNITS.map((u) => (
                      <MenuItem key={u.value} value={u.value}>
                        {u.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </Box>

              {/* MIN LEAD TIME */}
              <Box>
                <Typography variant="body2" mb={0.5}>
                  Thời gian tối thiểu có thể đặt trước cuộc hẹn
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Checkbox
                    size="small"
                    checked={minEnabled}
                    onChange={(e) => setMinEnabled(e.target.checked)}
                  />
                  <TextField
                    size="small"
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(Math.max(1, Number(e.target.value) || 1))}
                    disabled={!minEnabled}
                    sx={{ width: 90 }}
                    inputProps={{ min: 1 }}
                  />
                  <TextField
                    select
                    size="small"
                    value={minUnit}
                    onChange={(e) => setMinUnit(e.target.value)}
                    disabled={!minEnabled}
                    sx={{ width: 100 }}
                  >
                    {MIN_UNITS.map((u) => (
                      <MenuItem key={u.value} value={u.value}>
                        {u.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </Box>

              <Button variant="contained" fullWidth onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu phạm vi'}
              </Button>
            </Stack>
          </LocalizationProvider>
        </Box>
      )}
    </Card>
  );
};

export default MentorshipBookingWindowCard;
