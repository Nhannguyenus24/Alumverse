import { useMemo, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';

const WEEK_DAY_LABELS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEK_DAY_FULL_VI = ['CN', 'THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7'];

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
 * availabilityMap is { "YYYY-MM-DD": { [hour]: availabilityId } }.
 * Returns the availabilityId for the slot, or null if not bookable.
 */
const getSlotAvailabilityId = (date, hour, availabilityMap) => {
  const key = date.format('YYYY-MM-DD');
  const dayMap = availabilityMap[key];
  if (!dayMap) return null;
  return dayMap[hour] ?? null;
};

const MentorshipSlotPicker = ({
  availabilityMap = {},
  selectedSlot,
  onSelectSlot,
  hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
  timezoneLabel = '(GMT+07:00) Giờ Đông Dương - TP Hồ Chí Minh',
}) => {
  const today = useMemo(() => dayjs().startOf('day'), []);
  const [anchorDate, setAnchorDate] = useState(today);
  const [weekStart, setWeekStart] = useState(today);

  const calendarCells = useMemo(() => buildMiniCalendar(anchorDate), [anchorDate]);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')),
    [weekStart],
  );

  const handlePickFromMini = (cellDate) => {
    setAnchorDate(cellDate);
    setWeekStart(cellDate);
  };

  const formatHourLabel = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${display}:00${period}`;
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
              const dateKey = date.format('YYYY-MM-DD');
              const dayMap = availabilityMap[dateKey];
              const hasAny = Boolean(dayMap && Object.keys(dayMap).length);
              const isPast = date.isBefore(today);
              const isSelected = date.isSame(weekStart, 'day');

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

        {/* WEEK SLOT GRID */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" mb={1}>
            <IconButton size="small" onClick={() => setWeekStart((d) => d.subtract(1, 'day'))}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>

            <Box
              sx={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: 1,
                textAlign: 'center',
              }}
            >
              {weekDates.map((date) => {
                const isToday = date.isSame(today, 'day');
                return (
                  <Box key={date.toString()}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {WEEK_DAY_FULL_VI[date.day()]}
                    </Typography>
                    <Box
                      sx={{
                        mx: 'auto',
                        mt: 0.5,
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: isToday ? 'primary.main' : 'transparent',
                        color: isToday ? 'common.white' : 'text.primary',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {date.date()}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <IconButton size="small" onClick={() => setWeekStart((d) => d.add(1, 'day'))}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 1,
              maxHeight: 420,
              overflowY: 'auto',
              pr: 0.5,
            }}
          >
            {hours.map((hour) =>
              weekDates.map((date) => {
                const availabilityId = getSlotAvailabilityId(date, hour, availabilityMap);
                const available = availabilityId != null;
                const isSelected =
                  selectedSlot &&
                  selectedSlot.date.isSame(date, 'day') &&
                  selectedSlot.hour === hour;

                if (!available) {
                  return (
                    <Box
                      key={`${date.toString()}-${hour}`}
                      sx={{
                        height: 38,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.disabled',
                      }}
                    >
                      —
                    </Box>
                  );
                }

                return (
                  <Button
                    key={`${date.toString()}-${hour}`}
                    variant={isSelected ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => onSelectSlot({ date, hour, availabilityId })}
                    sx={{
                      height: 38,
                      borderRadius: 999,
                      fontWeight: 600,
                      fontSize: 13,
                      textTransform: 'none',
                      minWidth: 0,
                      px: 1,
                    }}
                  >
                    {formatHourLabel(hour)}
                  </Button>
                );
              }),
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MentorshipSlotPicker;
