import { useState } from 'react';
import { 
  Box, Button, Container, Stack, Typography, 
  Card, Checkbox, FormControlLabel 
} from '@mui/material';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Page from '../../components/Page';
import Sidebar from '../../components/Sidebar';
import TopTabFilter from '../../components/TopTabFilter';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

/* ================= DATA ================= */

const SIDEBAR = [
  { id: '/development', label: 'Phát triển', icon: <TrendingUpIcon /> },
  { id: '/development/mentorship', label: 'Cố vấn', icon: <SchoolIcon /> },
  { id: '/development/academics', label: 'Cơ hội học tập', icon: <MenuBookIcon /> },
  { id: '/development/jobs', label: 'Cơ hội việc làm', icon: <WorkIcon /> },
];

const TOP_TABS = [
  { label: 'Giới thiệu', path: '/development/mentorship' },
  { label: 'Tìm kiếm', path: '/development/mentorship/search' },
  { label: 'Dashboard', path: '/development/mentorship/dashboard' },
  { label: 'Profile', path: '/development/mentorship/profile' },
  { label: 'Lịch cá nhân', path: '/development/mentorship/calendar' },
  { label: 'Đăng ký', path: '/development/mentorship/appointment' },
];

const WEEK_DAYS = ['Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy','Chủ nhật'];

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

/* ================= COMPONENT ================= */

const MentorshipYourCalendarPage = () => {
  const navigate = useOrgNavigate();

  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [startTime, setStartTime] = useState(dayjs().hour(13).minute(0));
  const [endTime, setEndTime] = useState(dayjs().hour(14).minute(0));
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const calendarDays = generateCalendar(2025, 0);

  return (
    <Page title="Cố vấn - Lịch cá nhân">
      <Container maxWidth={false} disableGutters sx={{ pb: 6 }}>
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2, md: 3 },
            }}
          >
            {/* SIDEBAR */}
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
              <Sidebar items={SIDEBAR} />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro"
                caption="HCMC Metro Opening"
              />
            </Stack>

            {/* MAIN CONTENT STACK (OUTER) */}
            <Stack spacing={4} sx={{ flex: 1, minWidth: 0, width: '100%', px: { xs: 1.5, sm: 2, md: 2.75 } }}>
              
              {/* TOP SECTION STACK */}
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant="h1"
                    fontWeight={800}
                    color="primary.main"
                    sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
                  >
                    CỐ VẤN
                  </Typography>
                  <Button variant="contained">Trở thành cố vấn</Button>
                </Box>

                <TopTabFilter tabs={TOP_TABS} onNavigate={navigate} />

                <Typography color="text.secondary">
                  Chọn thời gian rảnh cho tiến trình cố vấn của bạn.
                </Typography>
              </Stack>

              {/* LOWER CONTENT STACK */}
              <Stack spacing={4}>
                {/* SECTION TITLE */}
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                  <Typography variant="h3" fontWeight={700}>
                    Lịch cá nhân
                  </Typography>

                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" color="inherit">Huỷ</Button>
                    <Button variant="contained">Lưu thay đổi</Button>
                  </Stack>
                </Box>

                {/* CALENDAR & TOOLS CONTENT */}
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
                        <Box key={i} sx={{
                          height: 110,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: d.current ? '#fff' : 'action.hover',
                          p: 1
                        }}>
                          <Typography variant="caption" color={d.current ? 'text.primary' : 'text.disabled'} fontWeight={d.current ? 600 : 400}>
                            {d.day}
                          </Typography>

                          {d.current && d.day === 15 && (
                            <Box sx={{
                              mt: 1, px: 1, py: 0.3, borderRadius: 1,
                              bgcolor: 'primary.main', color: '#fff', fontSize: 11,
                              whiteSpace: 'nowrap', textAlign: 'center'
                            }}>
                              13:00 - 14:00
                            </Box>
                          )}

                          {d.current && d.day === 22 && (
                            <Box sx={{
                              mt: 1, px: 1, py: 0.3, borderRadius: 1,
                              bgcolor: 'success.main', color: '#fff', fontSize: 11,
                              whiteSpace: 'nowrap', textAlign: 'center'
                            }}>
                              13:00 - 14:00
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* RIGHT: PANEL CONTROLS */}
                  <Box sx={{ width: { xs: '100%', lg: 320 } }}>
                    <Stack spacing={3}>
                      {/* ADD TIME CARD */}
                      <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                        <Typography fontWeight={700} variant="subtitle1">Thêm lịch rảnh</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          Thêm thời gian rảnh của bạn.
                        </Typography>

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <Stack spacing={2.5}>
                            <Stack direction="row" spacing={1}>
                              <TimePicker label="Start" value={startTime} onChange={setStartTime} slotProps={{ textField: { size: 'small' } }} />
                              <TimePicker label="End" value={endTime} onChange={setEndTime} slotProps={{ textField: { size: 'small' } }} />
                            </Stack>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {WEEK_DAYS.map((d) => (
                                <Button key={d} variant="outlined" size="small" sx={{ fontSize: '0.7rem', px: 1, minWidth: 0 }}>
                                  {d.split(' ')[1]}
                                </Button>
                              ))}
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
                      </Card>

                      {/* SUMMARY CARD */}
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

            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default MentorshipYourCalendarPage;