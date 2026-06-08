import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
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
import MentorshipProfileLayout from '../../layouts/ProfileLayout';
import MentorshipBookingItem from '../../components/mentorship/MentorshipBookingItem';
import MentorshipBookingWindowCard from '../../components/mentorship/MentorshipBookingWindowCard';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyMentorSessions } from '../../hooks/mentorship/useMyMentorSessions';
import { useMyAvailabilities } from '../../hooks/mentorship/useMyAvailabilities';
import { useAddAvailability } from '../../hooks/mentorship/useAddAvailability';
import { useDeleteAvailability } from '../../hooks/mentorship/useDeleteAvailability';
import { useUpdateAvailability } from '../../hooks/mentorship/useUpdateAvailability';
import { useUpdateMentorProfile } from '../../hooks/mentorship/useUpdateMentorProfile';
import { formatFixed } from '../../utils/numberFormatter';
import { MENTOR_PROFILE_TABS } from '../../constants/mentorshipNav';

const TOP_TABS = MENTOR_PROFILE_TABS;

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

const WEEK_DAYS = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];
const WEEK_DAYS_SHORT = ['Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'CN'];

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
  const navigate = useOrgNavigate();

  const profileQuery = useMyMentorProfile();
  const sessionsQuery = useMyMentorSessions({ page: 0, limit: 100 });
  const availabilityQuery = useMyAvailabilities();
  const addMutation = useAddAvailability();
  const updateAvailabilityMutation = useUpdateAvailability();
  const deleteMutation = useDeleteAvailability();
  const updateProfileMutation = useUpdateMentorProfile();

  const handleSaveBookingWindow = async (jsonString) => {
    try {
      await updateProfileMutation.updateProfile({ bookingWindowSettings: jsonString });
    } catch {
      /* error surfaced via mutation.errorMessage */
    }
  };

  const [anchorMonth, setAnchorMonth] = useState(dayjs().startOf('month'));
  const [showAddTime, setShowAddTime] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [startTime, setStartTime] = useState(dayjs().hour(13).minute(0));
  const [endTime, setEndTime] = useState(dayjs().hour(14).minute(0));
  const [singleDate, setSingleDate] = useState(dayjs());
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs().add(1, 'month'));
  const [selectedDays, setSelectedDays] = useState([]);

  const [editingSlot, setEditingSlot] = useState(null);
  const [editStartTime, setEditStartTime] = useState(null);
  const [editEndTime, setEditEndTime] = useState(null);
  const [editError, setEditError] = useState(null);

  const openEditSlot = (slot) => {
    setEditingSlot(slot);
    setEditStartTime(dayjs(slot.startTime));
    setEditEndTime(dayjs(slot.endTime));
    setEditError(null);
  };

  const closeEditSlot = () => {
    setEditingSlot(null);
    setEditStartTime(null);
    setEditEndTime(null);
    setEditError(null);
  };

  const submitEditSlot = async () => {
    if (!editingSlot || !editStartTime || !editEndTime) return;
    if (!editEndTime.isAfter(editStartTime)) {
      setEditError('Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }
    if (!editStartTime.isAfter(dayjs())) {
      setEditError('Slot phải nằm trong tương lai.');
      return;
    }
    try {
      await updateAvailabilityMutation.updateAvailability({
        id: editingSlot.id,
        startTime: editStartTime.format('YYYY-MM-DDTHH:mm:ss'),
        endTime: editEndTime.format('YYYY-MM-DDTHH:mm:ss'),
      });
      closeEditSlot();
    } catch (err) {
      const message =
        err?.response?.data?.message ?? updateAvailabilityMutation.errorMessage ?? 'Không cập nhật được slot.';
      setEditError(message);
    }
  };

  const toggleDay = (index) =>
    setSelectedDays((prev) => (prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]));

  const profile = profileQuery.data;
  const availabilities = useMemo(
    () => availabilityQuery.data ?? [],
    [availabilityQuery.data],
  );
  const sessions = useMemo(
    () => sessionsQuery.data?.items ?? [],
    [sessionsQuery.data],
  );
  const upcomingSessions = useMemo(
    () => sessions.filter((s) => s.status === 'Confirmed' || s.status === 'Pending'),
    [sessions],
  );

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

  const handleSave = async () => {
    setSubmitMessage(null);
    try {
      const today = dayjs();
      let dates = [];
      if (repeatWeekly) {
        if (selectedDays.length === 0) {
          setSubmitMessage({ severity: 'error', text: 'Hãy chọn ít nhất 1 thứ trong tuần.' });
          return;
        }
        dates = expandDates(startDate, endDate, selectedDays);
        if (dates.length === 0) {
          setSubmitMessage({ severity: 'error', text: 'Không có ngày nào khớp khoảng thời gian + thứ đã chọn.' });
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
        setSubmitMessage({ severity: 'error', text: 'Giờ kết thúc phải sau giờ bắt đầu.' });
        return;
      }
      const inPast = slots.some((s) => s.startTime.isBefore(today));
      if (inPast) {
        setSubmitMessage({ severity: 'error', text: 'Không thể tạo slot trong quá khứ.' });
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
          const message = err?.response?.data?.message ?? 'lỗi không xác định';
          failures.push(`${slot.startTime.format('DD/MM HH:mm')}: ${message}`);
        }
      }
      const baseText = `Đã thêm ${success}/${slots.length} slot.`;
      setSubmitMessage({
        severity: success === slots.length ? 'success' : failures.length === slots.length ? 'error' : 'warning',
        text: failures.length ? `${baseText} Lỗi: ${failures.slice(0, 3).join('; ')}` : baseText,
      });
    } catch {
      setSubmitMessage({ severity: 'error', text: addMutation.errorMessage ?? 'Không thể thêm lịch.' });
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Xóa slot này khỏi lịch?')) return;
    try {
      await deleteMutation.deleteAvailability(id);
    } catch {
      /* surfaced via deleteMutation.errorMessage */
    }
  };

  const user = {
    name: profile?.fullName ?? 'Tài khoản của tôi',
    role:
      profile && (profile.currentJobTitle || profile.currentCompany)
        ? [profile.currentJobTitle, profile.currentCompany].filter(Boolean).join(' @ ')
        : 'Mentor',
    avatar: profile?.avatarUrl ?? '',
    cover: DEFAULT_COVER,
  };

  return (
    <Page title="Cố vấn - Lịch rảnh">
      <MentorshipProfileLayout user={user} cover={user.cover} tabs={TOP_TABS} onNavigate={navigate} mode="mentor">
        <Stack spacing={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Typography variant="h2" fontWeight={800} color="primary.main">
              LỊCH RẢNH
            </Typography>
          </Box>

          {deleteMutation.errorMessage && (
            <Alert severity="error">{deleteMutation.errorMessage}</Alert>
          )}

          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* LEFT: CALENDAR VIEW */}
            <Box sx={{ flex: 1, py: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <IconButton onClick={() => setAnchorMonth((d) => d.subtract(1, 'month'))}>
                  <ChevronLeftIcon />
                </IconButton>
                <Typography fontWeight={700}>
                  Tháng {anchorMonth.month() + 1}, {anchorMonth.year()}
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
                      color: '#fff',
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
                  <CircularProgress />
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
                          bgcolor: inMonth ? '#fff' : 'action.hover',
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
                            const booked = slot.status !== 'Available';
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
                                  color: '#fff',
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
                                      sx={{ color: '#fff', p: 0, mr: 0.25 }}
                                      onClick={() => openEditSlot(slot)}
                                      aria-label="edit slot"
                                    >
                                      <EditOutlinedIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      sx={{ color: '#fff', p: 0 }}
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
            </Box>

            {/* RIGHT: PANEL CONTROLS */}
            <Box sx={{ width: { xs: '100%', lg: 400 } }}>
              <Stack spacing={3}>
                {/* 1. UPCOMING APPOINTMENTS */}
                <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                  <Typography fontWeight={700} mb={2} variant="subtitle1">
                    Lịch hẹn của tôi
                  </Typography>
                  {sessionsQuery.isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : upcomingSessions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Bạn chưa có lịch hẹn nào sắp tới.
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
                </Card>

                {/* 2. BOOKING WINDOW */}
                <MentorshipBookingWindowCard
                  initialSettings={profile?.bookingWindowSettings ?? null}
                  onSave={handleSaveBookingWindow}
                  saving={updateProfileMutation.isPending}
                />

                {/* 3. ADD TIME CARD */}
                <Card sx={{ border: '1px solid', borderColor: 'divider' }} elevation={0}>
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
                      Thêm lịch rảnh
                    </Typography>
                    <Typography sx={{ fontSize: 18 }}>{showAddTime ? '▴' : '▾'}</Typography>
                  </Box>

                  {showAddTime && (
                    <Box sx={{ px: 3, pb: 3 }}>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Chọn khung giờ và ngày để mentee có thể đặt lịch.
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                        Múi giờ: (GMT+07:00) Giờ Đông Dương — TP Hồ Chí Minh
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Stack spacing={2}>
                          <Stack direction="row" spacing={1}>
                            <TimePicker
                              label="Bắt đầu"
                              value={startTime}
                              onChange={setStartTime}
                              slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                            <TimePicker
                              label="Kết thúc"
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
                            label={<Typography variant="body2">Lặp lại theo tuần</Typography>}
                          />

                          {repeatWeekly ? (
                            <>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {WEEK_DAYS_SHORT.map((label, index) => {
                                  const isSelected = selectedDays.includes(index);
                                  return (
                                    <Button
                                      key={index}
                                      variant={isSelected ? 'contained' : 'outlined'}
                                      size="small"
                                      onClick={() => toggleDay(index)}
                                      sx={{ fontSize: '0.75rem', px: 1.5, minWidth: 0 }}
                                    >
                                      {label}
                                    </Button>
                                  );
                                })}
                              </Box>
                              <Stack spacing={1.5}>
                                <DatePicker
                                  label="Từ ngày"
                                  value={startDate}
                                  onChange={setStartDate}
                                  minDate={dayjs()}
                                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                                <DatePicker
                                  label="Đến ngày"
                                  value={endDate}
                                  onChange={setEndDate}
                                  minDate={startDate ?? dayjs()}
                                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                              </Stack>
                            </>
                          ) : (
                            <DatePicker
                              label="Ngày"
                              value={singleDate}
                              onChange={setSingleDate}
                              minDate={dayjs()}
                              slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                          )}

                          {submitMessage && (
                            <Alert severity={submitMessage.severity}>{submitMessage.text}</Alert>
                          )}

                          <Button
                            variant="contained"
                            fullWidth
                            onClick={handleSave}
                            disabled={addMutation.isPending}
                          >
                            {addMutation.isPending ? 'Đang lưu...' : 'Cập nhật lịch'}
                          </Button>
                        </Stack>
                      </LocalizationProvider>
                    </Box>
                  )}
                </Card>

                {/* 4. SUMMARY CARD */}
                <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                  <Typography fontWeight={700} mb={2} variant="subtitle1">
                    Tổng kết (sắp tới)
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      Số slot trống:
                      <Box component="span" color="primary.main" fontWeight={700}>
                        {summary.slotCount}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      Tổng thời gian:
                      <Box component="span" color="primary.main" fontWeight={700}>
                        {summary.totalHours} giờ
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      Trung bình mỗi slot:
                      <Box component="span" color="primary.main" fontWeight={700}>
                        {summary.avgMinutes} phút
                      </Box>
                    </Typography>
                  </Stack>
                </Card>
              </Stack>
            </Box>
          </Box>
        </Stack>

        <Dialog open={Boolean(editingSlot)} onClose={closeEditSlot} fullWidth maxWidth="xs">
          <DialogTitle>Chỉnh sửa slot</DialogTitle>
          <DialogContent>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack spacing={2} mt={1}>
                <Typography variant="caption" color="text.secondary">
                  Múi giờ: (GMT+07:00) Giờ Đông Dương — TP Hồ Chí Minh
                </Typography>
                <DatePicker
                  label="Ngày"
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
                    label="Bắt đầu"
                    value={editStartTime}
                    onChange={setEditStartTime}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <TimePicker
                    label="Kết thúc"
                    value={editEndTime}
                    onChange={setEditEndTime}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Stack>
                {editError && <Alert severity="error">{editError}</Alert>}
              </Stack>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditSlot} disabled={updateAvailabilityMutation.isPending}>
              Huỷ
            </Button>
            <Button
              variant="contained"
              onClick={submitEditSlot}
              disabled={updateAvailabilityMutation.isPending}
            >
              {updateAvailabilityMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogActions>
        </Dialog>
      </MentorshipProfileLayout>
    </Page>
  );
};

export default MentorshipYourCalendarPage;
