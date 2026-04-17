import { useState } from 'react';
import { useLocation } from 'react-router';
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Card,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel
} from '@mui/material';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';

import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Page from '../components/Page';
import ForumFilterPanel from '../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../components/forum/ForumSponsoredCard';

/* ================= DATA ================= */

const SIDEBAR_TABS = [
  { id: 'growth', label: 'Phát triển', icon: <TrendingUpIcon /> },
  { id: 'mentorship', label: 'Cố vấn', icon: <GroupsIcon /> },
  { id: 'learning', label: 'Cơ hội học tập', icon: <SchoolIcon /> },
  { id: 'jobs', label: 'Cơ hội việc làm', icon: <WorkIcon /> },
];

const TOP_TABS = [
  { label: 'Giới thiệu', path: '/chances/mentorship' },
  { label: 'Tìm kiếm', path: '/chances/mentorship/search' },
  { label: 'Dashboard', path: '/chances/mentorship/dashboard' },
  { label: 'Profile', path: '/chances/mentorship/profile' },
  { label: 'Lịch cá nhân', path: '/chances/mentorship/calendar' },
  { label: 'Đăng ký', path: '/chances/mentorship/appointment' },
];

const WEEK_DAYS = ['Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy','Chủ nhật'];

/* ================= CALENDAR ================= */

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
  const location = useLocation();

  const [selectedSidebar, setSelectedSidebar] = useState('mentorship');
  const [repeatWeekly, setRepeatWeekly] = useState(false);

  const [startTime, setStartTime] = useState(dayjs().hour(13).minute(0));
  const [endTime, setEndTime] = useState(dayjs().hour(14).minute(0));
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const calendarDays = generateCalendar(2025, 0);

  return (
    <Page title="Cố vấn">
      <Container maxWidth={false} disableGutters sx={{ pt: '64px', pb: 6, backgroundColor: '#F3F6FB' }}>
        <Container maxWidth="xl" sx={{ pt: 4, px: { xs: 2, lg: 6 } }}>
          <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>

            {/* SIDEBAR */}
            <Stack spacing={2} sx={{ width: { md: 260 } }}>
              <ForumFilterPanel
                filters={SIDEBAR_TABS}
                selectedId={selectedSidebar}
                onChange={setSelectedSidebar}
              />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro"
                caption="HCMC Metro Opening"
              />
            </Stack>

            {/* MAIN */}
            <Stack spacing={4} flex={1}>

              {/* HEADER */}
              <Box display="flex" justifyContent="space-between" flexWrap="wrap">
                <Typography variant="h1" fontWeight={800} color="primary.main">
                  CỐ VẤN
                </Typography>
                <Button variant="contained">Trở thành cố vấn</Button>
              </Box>

              {/* TABS */}
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                {TOP_TABS.map((tab) => {
                  const isActive =
                    tab.path === '/chances/mentorship'
                      ? location.pathname === tab.path
                      : location.pathname.startsWith(tab.path);

                  return (
                    <Button
                      key={tab.label}
                      variant={isActive ? 'contained' : 'outlined'}
                      onClick={() => navigate(tab.path)}
                    >
                      {tab.label}
                    </Button>
                  );
                })}
              </Stack>

              {/* DESCRIPTION */}
              <Typography>
                Chọn thời gian rảnh cho tiến trình cố vấn của bạn.
              </Typography>

              {/* TITLE */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h3" fontWeight={700}>
                  Lịch cá nhân
                </Typography>

                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" color="inherit">Huỷ</Button>
                  <Button variant="contained">Lưu thay đổi</Button>
                </Stack>
              </Box>

              {/* CONTENT */}
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>

                {/* CALENDAR */}
                <Card sx={{ flex: 1, p: 3 }}>
                  <Box display="flex" justifyContent="space-between" mb={3}>
                    <Button>{'<'}</Button>
                    <Typography fontWeight={700}>Tháng 1, 2025</Typography>
                    <Button>{'>'}</Button>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                    {WEEK_DAYS.map((d) => (
                      <Box key={d} sx={{ bgcolor: 'primary.main', color: '#fff', textAlign: 'center', py: 1 }}>
                        {d}
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                    {calendarDays.map((d, i) => (
                      <Box key={i} sx={{
                        height: 110,
                        border: '1px solid #eee',
                        bgcolor: d.current ? '#fff' : '#f5f5f5',
                        p: 1
                      }}>
                        <Typography variant="caption" color={d.current ? 'text.primary' : 'text.disabled'}>
                          {d.day}
                        </Typography>

                        {d.current && d.day === 15 && (
                          <Box sx={{
                            mt: 1,
                            px: 1,
                            py: 0.3,
                            borderRadius: 999,
                            bgcolor: 'primary.main',
                            color: '#fff',
                            fontSize: 12,
                            whiteSpace: 'nowrap'
                          }}>
                            13:00 - 14:00
                          </Box>
                        )}

                        {d.current && d.day === 22 && (
                          <Box sx={{
                            mt: 1,
                            px: 1,
                            py: 0.3,
                            borderRadius: 999,
                            bgcolor: 'success.main',
                            color: '#fff',
                            fontSize: 12,
                            whiteSpace: 'nowrap'
                          }}>
                            13:00 - 14:00
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Card>

                {/* RIGHT PANEL */}
                <Box sx={{ width: { xs: '100%', lg: 300 } }}>
                  <Stack spacing={3}>

                    <Card sx={{ p: 3 }}>
                      <Typography fontWeight={700}>Thêm lịch rảnh</Typography>
                      <Typography variant="body2" mb={2}>
                        Thêm thời gian rảnh của bạn.
                      </Typography>

                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Stack spacing={2}>

                          <Stack direction="row" spacing={2}>
                            <TimePicker label="Start" value={startTime} onChange={setStartTime} />
                            <TimePicker label="End" value={endTime} onChange={setEndTime} />
                          </Stack>

                          <Stack direction="row" flexWrap="wrap" gap={1}>
                            {WEEK_DAYS.map((d) => (
                              <Button key={d} variant="outlined">{d}</Button>
                            ))}
                          </Stack>

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={repeatWeekly}
                                onChange={(e) => setRepeatWeekly(e.target.checked)}
                              />
                            }
                            label="Lặp lại mỗi tuần"
                          />

                          <Stack direction="row" spacing={2}>
                            <DatePicker label="Start date" value={startDate} onChange={setStartDate} disabled={!repeatWeekly} />
                            <DatePicker label="End date" value={endDate} onChange={setEndDate} disabled={!repeatWeekly} />
                          </Stack>

                          <Button variant="contained">Thêm lịch rảnh</Button>
                        </Stack>
                      </LocalizationProvider>
                    </Card>

                    <Card sx={{ p: 3 }}>
                      <Typography fontWeight={700} mb={2}>Tổng kết</Typography>

                      <Typography>
                        Số cuộc họp mỗi tuần:{' '}
                        <Box component="span" color="primary.main" fontWeight={700}>3</Box>
                      </Typography>
                      <Typography>
                        Tổng thời gian:{' '}
                        <Box component="span" color="primary.main" fontWeight={700}>3 giờ</Box>
                      </Typography>
                      <Typography>
                        Thời gian trung bình:{' '}
                        <Box component="span" color="primary.main" fontWeight={700}>1 giờ</Box>
                      </Typography>
                    </Card>

                  </Stack>
                </Box>

              </Box>

            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default MentorshipYourCalendarPage;