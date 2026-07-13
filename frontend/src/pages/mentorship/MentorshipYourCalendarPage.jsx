import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useMemo, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Page from '../../components/Page';
import { useSnackbar } from 'notistack';
import MentorshipProfileLayout from '../../layouts/ProfileLayout';
import MentorshipBookingItem from '../../components/mentorship/MentorshipBookingItem';
import MentorshipBookingWindowCard from '../../components/mentorship/MentorshipBookingWindowCard';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyMentorSessions } from '../../hooks/mentorship/useMyMentorSessions';
import { resolveMediaUrl } from '../../utils/imageUtils';
import { useMyAvailabilities } from '../../hooks/mentorship/useMyAvailabilities';
import { useAddAvailability } from '../../hooks/mentorship/useAddAvailability';
import { useDeleteAvailability } from '../../hooks/mentorship/useDeleteAvailability';
import { useUpdateAvailability } from '../../hooks/mentorship/useUpdateAvailability';
import { useUpdateMentorProfile } from '../../hooks/mentorship/useUpdateMentorProfile';
import { formatFixed } from '../../utils/numberFormatter';
import { getMentorProfileTabs } from '../../constants/mentorshipNav';
import { useTranslation } from 'react-i18next';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

const DEFAULT_COVER =
  'https://info.cognician.com/hubfs/220201%20mentorship-%20desktop.png';

const WEEK_DAYS_KEYS = ['cal_day_mon', 'cal_day_tue', 'cal_day_wed', 'cal_day_thu', 'cal_day_fri', 'cal_day_sat', 'cal_day_sun'];
const WEEK_DAYS_SHORT_KEYS = ['cal_day_short_mon', 'cal_day_short_tue', 'cal_day_short_wed', 'cal_day_short_thu', 'cal_day_short_fri', 'cal_day_short_sat', 'cal_day_short_sun'];

const buildMonthCells = (anchor) => {
  const startOfMonth = anchor.startOf('month');

  const offset = (startOfMonth.day() + 6) % 7;
  const daysInMonth = anchor.daysInMonth();
  const cells = [];
  for (let i = 0; i < offset; i++) {
    cells.push({ date: startOfMonth.subtract(offset - i, 'day'), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: startOfMonth.date(d), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: cells[cells.length - 1].date.add(1, 'day'), inMonth: false });
  }
  return cells;
};

const VI_WEEKDAY_INDEX_TO_DAYJS_DAY = [1, 2, 3, 4, 5, 6, 0];

const expandDates = (startDate, endDate, selectedDayIndexes) => {
  const result = [];
  if (!startDate || !endDate || endDate.isBefore(startDate, 'day')) return result;
  const wantedDayJs = new Set(selectedDayIndexes.map((i) => VI_WEEKDAY_INDEX_TO_DAYJS_DAY[i]));
  let cursor = startDate.startOf('day');
  const endStop = endDate.startOf('day');
  while (!cursor.isAfter(endStop)) {
    if (wantedDayJs.has(cursor.day())) result.push(cursor);
    cursor = cursor.add(1, 'day');
  }
  return result;
};

/* ================= COMPONENT ================= */

const MentorshipYourCalendarPage = () => {
  const { t } = useTranslation('mentorship');
  const WEEK_DAYS = WEEK_DAYS_KEYS.map((k) => t(k));
  const WEEK_DAYS_SHORT = WEEK_DAYS_SHORT_KEYS.map((k) => t(k));
  const TOP_TABS = getMentorProfileTabs(t);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const profileQuery = useMyMentorProfile();
  const sessionsQuery = useMyMentorSessions({ page: 0, limit: 100 });
  const availabilityQuery = useMyAvailabilities();
  const addMutation = useAddAvailability();
  const updateAvailabilityMutation = useUpdateAvailability();
  const deleteMutation = useDeleteAvailability();
  const updateProfileMutation = useUpdateMentorProfile();

  const handleSaveBookingWindow = useCallback(async (jsonString) => {
    try {
      await updateProfileMutation.updateProfile({ bookingWindowSettings: jsonString });
    } catch {
      /* error surfaced via mutation.errorMessage */
    }
  }, [updateProfileMutation]);

  const [anchorMonth, setAnchorMonth] = useState(dayjs().startOf('month'));
  const [showAddTime, setShowAddTime] = useState(false);

  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [singleDate, setSingleDate] = useState(dayjs());
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs().add(1, 'month'));
  const [selectedDays, setSelectedDays] = useState([]);

  const [editingSlot, setEditingSlot] = useState(null);
  const [editStartTime, setEditStartTime] = useState(null);
  const [editEndTime, setEditEndTime] = useState(null);

  const openEditSlot = useCallback((slot) => {
    setEditingSlot(slot);
    setEditStartTime(dayjs(slot.startTime));
    setEditEndTime(dayjs(slot.endTime));
  }, []);

  const closeEditSlot = useCallback(() => {
    setEditingSlot(null);
    setEditStartTime(null);
    setEditEndTime(null);
  }, []);

  const submitEditSlot = useCallback(async () => {
    if (!editingSlot || !editStartTime || !editEndTime) return;
    if (!editEndTime.isAfter(editStartTime)) {
      enqueueSnackbar(t('postpone_error_end_before_start'), { variant: 'error' });
      return;
    }
    if (!editStartTime.isAfter(dayjs())) {
      enqueueSnackbar(t('cal_slot_must_be_future'), { variant: 'error' });
      return;
    }
    try {
      await updateAvailabilityMutation.updateAvailability({
        id: editingSlot.id,
        startTime: editStartTime.format('YYYY-MM-DDTHH:mm:ss'),
        endTime: editEndTime.format('YYYY-MM-DDTHH:mm:ss'),
      });
      enqueueSnackbar(t('cal_slot_updated', 'Slot updated'), { variant: 'success' });
      closeEditSlot();
    } catch (err) {
      const message =
        err?.response?.data?.message ?? updateAvailabilityMutation.errorMessage ?? t('cal_slot_update_error');
      enqueueSnackbar(message, { variant: 'error' });
    }
  }, [editingSlot, editStartTime, editEndTime, updateAvailabilityMutation, closeEditSlot, enqueueSnackbar, t]);

  const toggleDay = useCallback((index) => {
    setSelectedDays((prev) => (prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]));
  }, []);

  const profile = profileQuery.data;
  const availabilities = useMemo(
    () => availabilityQuery.data ?? [],
    [availabilityQuery.data],
  );
  const sessions = useMemo(
    () => sessionsQuery.data?.items ?? [],
    [sessionsQuery.data],
  );
  const upcomingSessions = useMemo(() => {
    const now = dayjs();
    const ACTIVE = ['CONFIRMED', 'IN_PROGRESS', 'PENDING', 'RESCHEDULE_PROPOSED'];
    return sessions
      .filter((s) => ACTIVE.includes(s.status))
      .filter((s) => !s.endTime || dayjs(s.endTime).isAfter(now))
      .sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());
  }, [sessions]);

  const availabilityByDate = useMemo(() => {
    const map = {};
    for (const a of availabilities) {
      const key = dayjs(a.startTime).format('YYYY-MM-DD');
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [availabilities]);

  const summary = useMemo(() => {
    const now = dayjs();
    const upcoming = availabilities.filter((a) => dayjs(a.startTime).isAfter(now));
    const totalMinutes = upcoming.reduce(
      (acc, a) => acc + Math.max(0, dayjs(a.endTime).diff(dayjs(a.startTime), 'minute')),
      0,
    );
    return {
      slotCount: upcoming.length,
      totalHours: formatFixed(totalMinutes / 60, 1, '0.0'),
      avgMinutes: upcoming.length ? Math.round(totalMinutes / upcoming.length) : 0,
    };
  }, [availabilities]);

  const calendarCells = useMemo(() => buildMonthCells(anchorMonth), [anchorMonth]);

  const handleSave = useCallback(async () => {
    try {
      const today = dayjs();
      if (!startTime || !endTime) {
        enqueueSnackbar(t('cal_error_pick_times'), { variant: 'error' });
        return;
      }
      let dates = [];
      if (repeatWeekly) {
        if (selectedDays.length === 0) {
          enqueueSnackbar(t('cal_error_pick_day'), { variant: 'error' });
          return;
        }
        dates = expandDates(startDate, endDate, selectedDays);
        if (dates.length === 0) {
          enqueueSnackbar(t('cal_error_no_matching_dates'), { variant: 'error' });
          return;
        }
      } else {
        dates = [singleDate];
      }

      const slots = dates.map((d) => {
        const start = d.hour(startTime.hour()).minute(startTime.minute()).second(0);
        const end = d.hour(endTime.hour()).minute(endTime.minute()).second(0);
        return { startTime: start, endTime: end };
      });

      const invalid = slots.find(
        (s) => s.endTime.isBefore(s.startTime) || s.endTime.isSame(s.startTime),
      );
      if (invalid) {
        enqueueSnackbar(t('postpone_error_end_before_start'), { variant: 'error' });
        return;
      }
      const inPast = slots.some((s) => s.startTime.isBefore(today));
      if (inPast) {
        enqueueSnackbar(t('cal_error_slot_in_past'), { variant: 'error' });
        return;
      }

      let success = 0;
      const failures = [];
      for (const slot of slots) {
        try {
          await addMutation.addAvailability({
            startTime: slot.startTime.format('YYYY-MM-DDTHH:mm:ss'),
            endTime: slot.endTime.format('YYYY-MM-DDTHH:mm:ss'),
          });
          success += 1;
        } catch (err) {
          const message = err?.response?.data?.message ?? t('cal_error_unknown');
          failures.push(`${slot.startTime.format('DD/MM HH:mm')}: ${message}`);
        }
      }
      const baseText = t('cal_slots_added', { success, total: slots.length });
      enqueueSnackbar(
        failures.length ? `${baseText} ${t('cal_error_prefix')}${failures.slice(0, 3).join('; ')}` : baseText,
        { variant: success === slots.length ? 'success' : failures.length === slots.length ? 'error' : 'warning' }
      );
    } catch {
      enqueueSnackbar(addMutation.errorMessage ?? t('cal_error_add_schedule'), { variant: 'error' });
    }
  }, [startTime, endTime, repeatWeekly, selectedDays, startDate, endDate, singleDate, addMutation, enqueueSnackbar, t]);

  const handleDeleteSlot = useCallback(async (id) => {
    if (!window.confirm(t('cal_confirm_delete_slot'))) return;
    try {
      await deleteMutation.deleteAvailability(id);
      enqueueSnackbar(t('cal_slot_deleted', 'Slot deleted'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(deleteMutation.errorMessage || 'Failed to delete', { variant: 'error' });
    }
  }, [deleteMutation, enqueueSnackbar, t]);

  const calendarUser = useMemo(() => ({
    name: profile?.fullName ?? t('my_account_fallback'),
    role:
      profile && (profile.currentJobTitle || profile.currentCompany)
        ? [profile.currentJobTitle, profile.currentCompany].filter(Boolean).join(' @ ')
        : t('mentor'),
    avatar: resolveMediaUrl(profile?.avatarUrl ?? ''),
    cover: resolveMediaUrl(profile?.coverUrl) || DEFAULT_COVER,
  }), [profile, t]);

  return (
    <Page title={t('page_title_calendar')}>
      <MentorshipProfileLayout user={calendarUser} cover={calendarUser.cover} tabs={TOP_TABS} onNavigate={navigate} mode="mentor">
        <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ScrollRevealItem sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h2" fontWeight={800} color="primary.main">
              {t('cal_heading')}
            </Typography>
          </ScrollRevealItem>

          <ScrollRevealItem sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* LEFT: CALENDAR VIEW */}
            <ScrollReveal direction="right" sx={{ flex: 1, py: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <IconButton onClick={() => setAnchorMonth((d) => d.subtract(1, 'month'))}>
                  <ChevronLeftIcon />
                </IconButton>
                <Typography fontWeight={700}>
                  {t('slot_picker_month', { month: anchorMonth.month() + 1, year: anchorMonth.year() })}
                </Typography>
                <IconButton onClick={() => setAnchorMonth((d) => d.add(1, 'month'))}>
                  <ChevronRightIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {WEEK_DAYS.map((d) => (
                  <Box
                    key={d}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      textAlign: 'center',
                      py: 1,
                      fontSize: '0.875rem',
                    }}
                  >
                    {d}
                  </Box>
                ))}
              </Box>

              {availabilityQuery.isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <LoadingSkeleton />
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                  {calendarCells.map(({ date, inMonth }, i) => {
                    const key = date.format('YYYY-MM-DD');
                    const slots = availabilityByDate[key] ?? [];
                    return (
                      <Box
                        key={i}
                        sx={{
                          minHeight: 110,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: inMonth ? 'background.paper' : 'action.hover',
                          p: 0.75,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color={inMonth ? 'text.primary' : 'text.disabled'}
                          fontWeight={inMonth ? 600 : 400}
                        >
                          {date.date()}
                        </Typography>
                        {inMonth &&
                          slots.map((slot) => {
                            const booked = slot.status !== 'AVAILABLE';
                            return (
                              <Stack
                                key={slot.id}
                                direction="row"
                                alignItems="center"
                                spacing={0.25}
                                sx={{
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 0.75,
                                  bgcolor: booked ? 'success.main' : 'primary.main',
                                  color: booked ? 'success.contrastText' : 'primary.contrastText',
                                  fontSize: 11,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <Box sx={{ flex: 1 }}>
                                  {dayjs(slot.startTime).format('HH:mm')}–
                                  {dayjs(slot.endTime).format('HH:mm')}
                                </Box>
                                {!booked && (
                                  <>
                                    <IconButton
                                      size="small"
                                      sx={{ color: 'primary.contrastText', p: 0, mr: 0.25 }}
                                      onClick={() => openEditSlot(slot)}
                                      aria-label="edit slot"
                                    >
                                      <EditOutlinedIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      sx={{ color: 'primary.contrastText', p: 0 }}
                                      onClick={() => handleDeleteSlot(slot.id)}
                                      disabled={deleteMutation.isPending}
                                      aria-label="delete slot"
                                    >
                                      <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </>
                                )}
                              </Stack>
                            );
                          })}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </ScrollReveal>

            {/* RIGHT: PANEL CONTROLS */}
            <ScrollReveal direction="left" sx={{ width: { xs: '100%', lg: 400 } }}>
              <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* 1. UPCOMING APPOINTMENTS */}
                <ScrollRevealItem><Card sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                  <Typography fontWeight={700} mb={2} variant="subtitle1">
                    {t('cal_upcoming_title')}
                  </Typography>
                  {sessionsQuery.isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <LoadingSkeleton />
                    </Box>
                  ) : upcomingSessions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t('cal_no_upcoming')}
                    </Typography>
                  ) : (
                    <Box sx={{ maxHeight: 360, overflowY: 'auto', pr: 1 }}>
                      <Stack spacing={2}>
                        {upcomingSessions.map((s) => (
                          <MentorshipBookingItem key={s.id} session={s} view="mentor" />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Card></ScrollRevealItem>

                {/* 2. BOOKING WINDOW */}
                <ScrollRevealItem><MentorshipBookingWindowCard
                  initialSettings={profile?.bookingWindowSettings ?? null}
                  onSave={handleSaveBookingWindow}
                  saving={updateProfileMutation.isPending}
                /></ScrollRevealItem>

                {/* 3. ADD TIME CARD */}
                <ScrollRevealItem><Card sx={{ border: '1px solid', borderColor: 'divider' }} elevation={0}>
                  <Box
                    sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowAddTime((prev) => !prev)}
                  >
                    <Typography fontWeight={700} variant="subtitle1">
                      {t('cal_add_availability_title')}
                    </Typography>
                    <Typography sx={{ fontSize: 18 }}>{showAddTime ? '▴' : '▾'}</Typography>
                  </Box>

                  {showAddTime && (
                    <Box sx={{ px: 3, pb: 3 }}>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {t('cal_pick_slot_hint')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                        {t('cal_timezone_note')}
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Stack spacing={2}>
                          <Stack direction="row" spacing={1}>
                            <TimePicker
                              label={t('postpone_label_start')}
                              value={startTime}
                              onChange={setStartTime}
                              slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                            <TimePicker
                              label={t('postpone_label_end')}
                              value={endTime}
                              onChange={setEndTime}
                              slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                          </Stack>

                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={repeatWeekly}
                                onChange={(e) => setRepeatWeekly(e.target.checked)}
                              />
                            }
                            label={<Typography variant="body2">{t('cal_repeat_weekly')}</Typography>}
                          />

                          {repeatWeekly ? (
                            <>
                              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, pb: 1.5 }}>
                                {WEEK_DAYS_SHORT.map((label, index) => {
                                  const isSelected = selectedDays.includes(index);
                                  return (
                                    <Button
                                      key={index}
                                      variant={isSelected ? 'contained' : 'outlined'}
                                      size="small"
                                      onClick={() => toggleDay(index)}
                                      sx={{
                                        minWidth: 0,
                                        px: 0,
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      {label}
                                    </Button>
                                  );
                                })}
                              </Box>
                              <Stack spacing={1.5}>
                                <DatePicker
                                  label={t('cal_from_date')}
                                  value={startDate}
                                  onChange={setStartDate}
                                  minDate={dayjs()}
                                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                                <DatePicker
                                  label={t('cal_to_date')}
                                  value={endDate}
                                  onChange={setEndDate}
                                  minDate={startDate ?? dayjs()}
                                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                              </Stack>
                            </>
                          ) : (
                            <DatePicker
                              label={t('cal_single_date')}
                              value={singleDate}
                              onChange={setSingleDate}
                              minDate={dayjs()}
                              slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                          )}

                          <Button
                            variant="contained"
                            fullWidth
                            onClick={handleSave}
                            disabled={addMutation.isPending}
                          >
                            {addMutation.isPending ? t('dialog_saving') : t('cal_update_schedule')}
                          </Button>
                        </Stack>
                      </LocalizationProvider>
                    </Box>
                  )}
                </Card></ScrollRevealItem>

                {/* 4. SUMMARY CARD */}
                <ScrollRevealItem><Card sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                  <Typography fontWeight={700} mb={2} variant="subtitle1">
                    {t('cal_summary_title')}
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      {t('cal_summary_slots')}
                      <Box component="span" color="primary.main" fontWeight={700}>
                        {summary.slotCount}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      {t('cal_summary_total_hours')}
                      <Box component="span" color="primary.main" fontWeight={700}>
                        {t('cal_summary_hours_value', { hours: summary.totalHours })}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      {t('cal_summary_avg')}
                      <Box component="span" color="primary.main" fontWeight={700}>
                        {t('cal_summary_minutes_value', { minutes: summary.avgMinutes })}
                      </Box>
                    </Typography>
                  </Stack>
                </Card></ScrollRevealItem>
              </ScrollRevealGroup>
            </ScrollReveal>
          </ScrollRevealItem>
        </ScrollRevealGroup>

        <Dialog open={Boolean(editingSlot)} onClose={closeEditSlot} fullWidth maxWidth="xs">
          <DialogTitle>{t('cal_edit_slot_title')}</DialogTitle>
          <DialogContent>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack spacing={2} mt={1}>
                <Typography variant="caption" color="text.secondary">
                  {t('cal_timezone_note')}
                </Typography>
                <DatePicker
                  label={t('cal_single_date')}
                  value={editStartTime}
                  onChange={(value) => {
                    if (!value) return;
                    const next = editStartTime
                      ? editStartTime.year(value.year()).month(value.month()).date(value.date())
                      : value;
                    const nextEnd = editEndTime
                      ? editEndTime.year(value.year()).month(value.month()).date(value.date())
                      : value.add(1, 'hour');
                    setEditStartTime(next);
                    setEditEndTime(nextEnd);
                  }}
                  minDate={dayjs()}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <Stack direction="row" spacing={1}>
                  <TimePicker
                    label={t('postpone_label_start')}
                    value={editStartTime}
                    onChange={setEditStartTime}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <TimePicker
                    label={t('postpone_label_end')}
                    value={editEndTime}
                    onChange={setEditEndTime}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Stack>
              </Stack>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditSlot} disabled={updateAvailabilityMutation.isPending}>
              {t('dialog_cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={submitEditSlot}
              disabled={updateAvailabilityMutation.isPending}
            >
              {updateAvailabilityMutation.isPending ? t('dialog_saving') : t('cal_save_slot')}
            </Button>
          </DialogActions>
        </Dialog>
      </MentorshipProfileLayout>
    </Page>
  );
};

export default MentorshipYourCalendarPage;
