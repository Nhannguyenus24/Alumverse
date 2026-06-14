import { useMemo, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';

const WEEK_DAY_LABELS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEK_DAY_FULL_VI = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const buildMiniCalendar = (anchor) => {
  const startOfMonth = anchor.startOf('month');
  const daysInMonth = anchor.daysInMonth();
  const firstWeekday = startOfMonth.day();
  const prevMonthLastDay = anchor.subtract(1, 'month').endOf('month').date();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({
      date: anchor.subtract(1, 'month').date(prevMonthLastDay - firstWeekday + i + 1),
      inMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: anchor.date(d), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const lastDate = cells[cells.length - 1].date;
    cells.push({ date: lastDate.add(1, 'day'), inMonth: false });
  }
  return cells;
};

/**
 * availabilityMap is { "YYYY-MM-DD": [{ id, startTime, endTime }, ...] }.
 * Returns the list of bookable slots for the given date (empty if none).
 */
const getSlotsForDate = (date, availabilityMap) => {
  const key = date.format('YYYY-MM-DD');
  return availabilityMap[key] ?? [];
};

const formatSlotRange = (slot) => {
  const start = dayjs(slot.startTime);
  const end = dayjs(slot.endTime);
  return `${start.format('HH:mm')} – ${end.format('HH:mm')}`;
};

const MentorshipSlotPicker = ({
  availabilityMap = {},
  selectedSlot,
  onSelectSlot,
  timezoneLabel = '(GMT+07:00) Giờ Đông Dương - TP Hồ Chí Minh',
}) => {
  const today = useMemo(() => dayjs().startOf('day'), []);
  const initialAnchor = useMemo(() => {
    const keys = Object.keys(availabilityMap)
      .filter((k) => (availabilityMap[k] ?? []).length > 0)
      .sort();
    const firstFuture = keys.find((k) => !dayjs(k).isBefore(today));
    return firstFuture ? dayjs(firstFuture) : today;
  }, [availabilityMap, today]);
  const [anchorDate, setAnchorDate] = useState(initialAnchor);
  const [selectedDate, setSelectedDate] = useState(initialAnchor);

  const calendarCells = useMemo(() => buildMiniCalendar(anchorDate), [anchorDate]);

  const daySlots = useMemo(
    () => getSlotsForDate(selectedDate, availabilityMap),
    [selectedDate, availabilityMap],
  );

  const handlePickFromMini = (cellDate) => {
    setAnchorDate(cellDate);
    setSelectedDate(cellDate);
  };

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: { xs: 2, md: 3 },
        bgcolor: 'background.paper',
      }}
    >
      {/* HEADER */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={1}
        mb={2}
      >
        <Typography fontWeight={600}>Chọn thời gian cho lịch hẹn</Typography>
        <Typography variant="caption" color="text.secondary">
          {timezoneLabel}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          gap: { xs: 2, md: 4 },
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* MINI CALENDAR */}
        <Box sx={{ width: { xs: '100%', md: 240 }, flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography fontWeight={600} fontSize={14}>
              {`Tháng ${anchorDate.month() + 1}, ${anchorDate.year()}`}
            </Typography>
            <Stack direction="row">
              <IconButton size="small" onClick={() => setAnchorDate((d) => d.subtract(1, 'month'))}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setAnchorDate((d) => d.add(1, 'month'))}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 0.5 }}>
            {WEEK_DAY_LABELS_VI.map((d) => (
              <Typography
                key={d}
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                {d}
              </Typography>
            ))}
            {calendarCells.map(({ date, inMonth }, i) => {
              const hasAny = getSlotsForDate(date, availabilityMap).length > 0;
              const isPast = date.isBefore(today);
              const isSelected = date.isSame(selectedDate, 'day');

              const disabled = !inMonth || isPast || !hasAny;

              return (
                <Box
                  key={i}
                  onClick={() => !disabled && handlePickFromMini(date)}
                  sx={{
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    cursor: disabled ? 'default' : 'pointer',
                    color: disabled
                      ? 'text.disabled'
                      : isSelected
                        ? 'common.white'
                        : 'text.primary',
                    bgcolor: isSelected ? 'primary.main' : hasAny && inMonth ? 'primary.lighter' : 'transparent',
                    borderRadius: '50%',
                    textDecoration: isPast && inMonth ? 'line-through' : 'none',
                    fontWeight: isSelected ? 700 : 500,
                    '&:hover': !disabled && !isSelected ? { bgcolor: 'action.hover' } : undefined,
                  }}
                >
                  {date.date()}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* SLOT LIST FOR SELECTED DAY */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={600} mb={1.5}>
            {`${WEEK_DAY_FULL_VI[selectedDate.day()]}, ${selectedDate.format('DD/MM/YYYY')}`}
          </Typography>

          {daySlots.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
              Không có khung giờ trống trong ngày này. Hãy chọn ngày khác trên lịch.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gap: 1,
                maxHeight: 420,
                overflowY: 'auto',
                pr: 0.5,
              }}
            >
              {daySlots.map((slot) => {
                const isSelected = selectedSlot?.availabilityId === slot.id;
                return (
                  <Button
                    key={slot.id}
                    variant={isSelected ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() =>
                      onSelectSlot({
                        availabilityId: slot.id,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                      })
                    }
                    sx={{
                      height: 40,
                      borderRadius: 999,
                      fontWeight: 600,
                      fontSize: 13,
                      textTransform: 'none',
                      minWidth: 0,
                      px: 1,
                    }}
                  >
                    {formatSlotRange(slot)}
                  </Button>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MentorshipSlotPicker;
