import { useState } from 'react';
import { 
  Box, Button, Stack, Typography, 
  Card, Checkbox, FormControlLabel 
} from '@mui/material';

import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Page from '../../components/Page';
import MentorshipProfileLayout from '../../layouts/MentorshipProfileLayout';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

/* ================= DATA ================= */

const TOP_TABS = [
  { label: 'Trang cá nhân', path: '/development/mentorship/profile' },
  { label: 'Dashboard', path: '/development/mentorship/dashboard' },
  { label: 'Lịch cá nhân', path: '/development/mentorship/calendar' },
];

const USER = {
  name: 'Nguyễn Lê Hoàng Dũng',
  role: 'Senior Software Engineer @ Google',
  avatar: 'https://i.pravatar.cc/150?img=3',
  cover: 'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619',
};

const WEEK_DAYS = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];
const WEEK_DAYS_SHORT = ['Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'CN'];

/* ================= CALENDAR LOGIC ================= */

const generateCalendar = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const startDay = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendar = [];
  let day = 1;
  let nextMonthDay = 1;

  for (let i = 0; i < 35; i++) {
    if (i < startDay) {
      calendar.push({ day: prevMonthDays - startDay + i + 1, current: false });
    } else if (day <= daysInMonth) {
      calendar.push({ day: day++, current: true });
    } else {
      calendar.push({ day: nextMonthDay++, current: false });
    }
  }
  return calendar;
};

/* ================= SUB-COMPONENTS ================= */

const ScheduleCard = () => (
  <Card sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }} elevation={0}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
      {/* IMAGE */}
      <Box sx={{ width: 60, height: 60, background: '#eee', borderRadius: 1, flexShrink: 0 }} />

      {/* CONTENT */}
      <Box sx={{ flex: 1 }}>
        <Typography fontWeight={600} fontSize={14}>Mock Interview</Typography>
        <Typography fontSize={13}>Tran Viet Bao Hoang</Typography>
        <Typography variant="caption">Thứ 5, 17h00 - 18h00</Typography>
      </Box>

      {/* BUTTON */}
      <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
        <Button variant="contained" fullWidth sx={{ whiteSpace: 'nowrap' }}>Bắt đầu</Button>
      </Box>
    </Stack>
  </Card>
);

/* ================= COMPONENT ================= */

const MentorshipYourCalendarPage = () => {
  const navigate = useOrgNavigate();

  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [startTime, setStartTime] = useState(dayjs().hour(13).minute(0));
  const [endTime, setEndTime] = useState(dayjs().hour(14).minute(0));
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [showAddTime, setShowAddTime] = useState(false);

  const toggleDay = (index) => {
    setSelectedDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
    );
  };

  const calendarDays = generateCalendar(2025, 0);

  return (
    <Page title="Cố vấn - Lịch cá nhân">
      <MentorshipProfileLayout user={USER} cover={USER.cover} tabs={TOP_TABS} onNavigate={navigate} mode="mentor">
        <Stack spacing={4}>
          {/* SECTION TITLE */}
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Typography variant="h2" fontWeight={800} color="primary.main">LỊCH CÁ NHÂN</Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" color="inherit">Huỷ</Button>
              <Button variant="contained">Lưu thay đổi</Button>
            </Stack>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* LEFT: CALENDAR VIEW */}
            <Box sx={{ flex: 1, py: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Button size="small">{'<'}</Button>
                <Typography fontWeight={700}>Tháng 1, 2025</Typography>
                <Button size="small">{'>'}</Button>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {WEEK_DAYS.map((d) => (
                  <Box key={d} sx={{ bgcolor: 'primary.main', color: '#fff', textAlign: 'center', py: 1, fontSize: '0.875rem' }}>
                    {d}
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {calendarDays.map((d, i) => (
                  <Box key={i} sx={{ height: 110, border: '1px solid', borderColor: 'divider', bgcolor: d.current ? '#fff' : 'action.hover', p: 1 }}>
                    <Typography variant="caption" color={d.current ? 'text.primary' : 'text.disabled'} fontWeight={d.current ? 600 : 400}>
                      {d.day}
                    </Typography>

                    {d.current && (d.day === 15 || d.day === 22) && (
                      <Box sx={{ mt: 1, px: 1, py: 0.3, borderRadius: 1, bgcolor: d.day === 15 ? 'primary.main' : 'success.main', color: '#fff', fontSize: 11, whiteSpace: 'nowrap', textAlign: 'center' }}>
                        13:00 - 14:00
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* RIGHT: PANEL CONTROLS */}
            <Box sx={{ width: { xs: '100%', lg: 400 } }}>
              <Stack spacing={3}>
                
                {/* 1. UPCOMING APPOINTMENTS (Moved to Top) */}
                <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                  <Typography fontWeight={700} mb={2} variant="subtitle1">Lịch hẹn của tôi</Typography>
                  <Box sx={{ maxHeight: 200, overflowY: 'auto', pr: 1 }}>
                    <Stack spacing={2}>
                      {[1, 2, 3].map((i) => <ScheduleCard key={i} />)}
                    </Stack>
                  </Box>
                </Card>

                {/* 2. ADD TIME CARD */}
                <Card sx={{ border: '1px solid', borderColor: 'divider' }} elevation={0}>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowAddTime((prev) => !prev)}>
                    <Typography fontWeight={700} variant="subtitle1">Thêm lịch rảnh</Typography>
                    <Typography sx={{ fontSize: 18 }}>{showAddTime ? '▴' : '▾'}</Typography>
                  </Box>

                  {showAddTime && (
                    <Box sx={{ px: 3, pb: 3 }}>
                      <Typography variant="body2" color="text.secondary" mb={2}>Thêm thời gian rảnh của bạn.</Typography>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Stack spacing={2.5}>
                          <Stack direction="row" spacing={1}>
                            <TimePicker label="Start" value={startTime} onChange={setStartTime} slotProps={{ textField: { size: 'small' } }} />
                            <TimePicker label="End" value={endTime} onChange={setEndTime} slotProps={{ textField: { size: 'small' } }} />
                          </Stack>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {WEEK_DAYS_SHORT.map((label, index) => {
                              const isSelected = selectedDays.includes(index);
                              return (
                                <Button key={index} variant={isSelected ? 'contained' : 'outlined'} size="small" onClick={() => toggleDay(index)} sx={{ fontSize: '0.75rem', px: 1.5, minWidth: 0 }}>
                                  {label}
                                </Button>
                              );
                            })}
                          </Box>
                          <FormControlLabel
                            control={<Checkbox size="small" checked={repeatWeekly} onChange={(e) => setRepeatWeekly(e.target.checked)} />}
                            label={<Typography variant="body2">Lặp lại mỗi tuần</Typography>}
                          />
                          <Stack spacing={2}>
                            <DatePicker label="Bắt đầu" value={startDate} onChange={setStartDate} disabled={!repeatWeekly} slotProps={{ textField: { size: 'small' } }} />
                            <DatePicker label="Kết thúc" value={endDate} onChange={setEndDate} disabled={!repeatWeekly} slotProps={{ textField: { size: 'small' } }} />
                          </Stack>
                          <Button variant="contained" fullWidth>Cập nhật lịch</Button>
                        </Stack>
                      </LocalizationProvider>
                    </Box>
                  )}
                </Card>

                {/* 3. SUMMARY CARD */}
                <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                  <Typography fontWeight={700} mb={2} variant="subtitle1">Tổng kết</Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      Số cuộc họp/tuần: <Box component="span" color="primary.main" fontWeight={700}>3</Box>
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      Tổng thời gian: <Box component="span" color="primary.main" fontWeight={700}>3 giờ</Box>
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      Trung bình: <Box component="span" color="primary.main" fontWeight={700}>1 giờ</Box>
                    </Typography>
                  </Stack>
                </Card>

              </Stack>
            </Box>
          </Box>
        </Stack>
      </MentorshipProfileLayout>
    </Page>
  );
};

export default MentorshipYourCalendarPage;