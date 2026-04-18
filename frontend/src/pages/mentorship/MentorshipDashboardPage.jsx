import { useState } from 'react';
import { useLocation } from 'react-router';
import { Box, Button, Container, Stack, Typography, Card, Avatar, Grid } from '@mui/material';

import StarBorderIcon from '@mui/icons-material/StarBorder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

import Page from '../../components/Page';
import Sidebar from '../../components/Sidebar';
import TopTabFilter from '../../components/TopTabFilter'; // Using unified component
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

const STATS = [
  { value: '4.9', label: 'đánh giá' },
  { value: '128', label: 'buổi họp' },
  { value: '3', label: 'cuộc họp trong tuần' },
];

/* ================= COMPONENT ================= */

const MentorshipDashboardPage = () => {
  const navigate = useOrgNavigate();

  return (
    <Page title="Cố vấn - Dashboard">
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
              
              {/* TOP SECTION STACK (Header & Tabs) */}
              <Stack spacing={2}>
                {/* HEADER */}
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

                {/* TOP TAB FILTER */}
                <TopTabFilter tabs={TOP_TABS} onNavigate={navigate} />

                <Typography color="text.secondary">
                  Chào mừng quay lại, <strong>Username</strong>! Hãy xem thành tích mentorship của bạn nhé!
                </Typography>
              </Stack>

              {/* LOWER CONTENT STACK (Stats & Sections) */}
              <Stack spacing={4}>
                {/* STATS BANNER */}
                <Box
                  sx={{
                    backgroundColor: 'primary.main',
                    borderRadius: 1,
                    px: { xs: 3, md: 6 },
                    py: { xs: 3, md: 4 },
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                    gap: 3,
                    textAlign: 'center',
                  }}
                >
                  {STATS.map((item, i) => (
                    <Box key={i}>
                      <Typography variant="h2" fontWeight={700} color="common.white">
                        {item.value}
                      </Typography>
                      <Typography variant="body2" color="common.white">
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* YÊU CẦU */}
                <Box>
                  <Header title="Yêu cầu chờ duyệt" />
                  <Grid2x2>
                    {[1, 2, 3, 4].map((i) => (
                      <RequestCard key={i} />
                    ))}
                  </Grid2x2>
                </Box>

                {/* MENTEES */}
                <Box>
                  <Header title="Mentee của bạn" />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <MenteeCard key={i} />
                    ))}
                  </Box>
                </Box>

                {/* BOTTOM: LỊCH & ĐÁNH GIÁ */}
                <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', lg: 'row' } }}>
                  <Box sx={{ flex: 1.5 }}>
                    <Header title="Lịch" />
                    <Stack spacing={2}>
                      {[1, 2, 3].map((i) => (
                        <ScheduleCard key={i} />
                      ))}
                    </Stack>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Header title="Đánh giá" right="4.9 (124 reviews)" />
                    <Stack spacing={2}>
                      {[1, 2].map((i) => (
                        <ReviewCard key={i} />
                      ))}
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

/* ================= REUSABLE (Added gray outlines to Cards) ================= */

const Header = ({ title, right }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
    <Typography variant="h4" fontWeight={700}>{title}</Typography>
    <Stack direction="row" spacing={1} alignItems="center">
      {right && <Typography color="primary.main" fontWeight={600}>{right}</Typography>}
      <Button size="small">Xem thêm</Button>
    </Stack>
  </Box>
);

const Grid2x2 = ({ children }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
    {children}
  </Box>
);

const RequestCard = () => (
  <Card sx={{ p: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={2}>
          <Avatar />
          <Box>
            <Typography fontWeight={700}>Winter Falls</Typography>
            <Typography variant="body2">Junior in Computer Science</Typography>
          </Box>
        </Stack>
        <Typography variant="caption">2 ngày trước</Typography>
      </Stack>

      <Typography fontWeight={600}>Lịch: Thứ 5, 17h00 - 18h00</Typography>
      <Typography>Muốn học thêm về android.</Typography>

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="contained" color="inherit">Từ chối</Button>
        <Button variant="contained">Chấp nhận</Button>
      </Stack>
    </Stack>
  </Card>
);

const MenteeCard = () => (
  <Card sx={{ p: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar />
      <Box>
        <Typography fontWeight={700}>Winter Falls</Typography>
        <Typography variant="body2">Junior in Computer Science</Typography>
      </Box>
    </Stack>
  </Card>
);

const ScheduleCard = () => (
  <Card sx={{ p: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ width: 80, height: 80, background: '#eee', borderRadius: 1 }} />
      <Box sx={{ flex: 1 }}>
        <Typography fontWeight={700}>Mock Interview</Typography>
        <Typography>Tran Viet Bao Hoang</Typography>
        <Typography variant="caption">Thứ 5, 17h00 - 18h00</Typography>
      </Box>
      <Button variant="contained">Vào cuộc họp</Button>
    </Stack>
  </Card>
);

const ReviewCard = () => (
  <Card sx={{ p: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={2}>
          <Avatar />
          <Box>
            <Typography fontWeight={700}>Winter Falls</Typography>
            <Typography variant="caption">2 ngày trước</Typography>
          </Box>
        </Stack>
        <Stack direction="row" color="warning.main">
          {[1,2,3,4,5].map(i => <StarBorderIcon key={i} fontSize="small" />)}
        </Stack>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
      </Typography>
    </Stack>
  </Card>
);

export default MentorshipDashboardPage;