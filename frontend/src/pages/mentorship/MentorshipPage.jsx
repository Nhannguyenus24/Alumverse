import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  Card,
  Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import StarIcon from '@mui/icons-material/Star';

import Page from '../../components/Page';
import ForumFilterPanel from '../../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';

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

const STATS = [
  { value: '500+', label: 'cố vấn' },
  { value: '2,000+', label: 'buổi họp' },
  { value: '100%', label: 'alumni đã xác nhận' },
];

const MOCK_MENTORS = Array(6).fill({
  name: 'Nguyễn Lê Hoàng Dũng',
  role: 'Senior Software Engineer @ Google',
  rating: 4.9,
  reviews: 124,
  tags: ['Frontend', 'Career', 'Interview'],
  avatar: 'https://i.pravatar.cc/150?img=3',
});

/* ================= COMPONENT ================= */

const MentorshipPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSidebar, setSelectedSidebar] = useState('mentorship');

  return (
    <Page title="Cố vấn">
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          pt: { xs: '56px', md: '64px' },
          pb: 6,
          backgroundColor: '#F3F6FB',
        }}
      >
        <Container maxWidth="xl" sx={{ pt: 4, px: { xs: 2, lg: 6 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
            }}
          >

            {/* SIDEBAR */}
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
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

            {/* MAIN CONTENT */}
            <Stack spacing={4} sx={{ flex: 1 }}>

              {/* HEADER */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Typography
                  variant="h1"
                  fontWeight={800}
                  color="primary.main"
                  sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
                >
                  CỐ VẤN
                </Typography>

                <Button variant="contained">
                  Trở thành cố vấn
                </Button>
              </Box>

              {/* TOP TAB SWITCH */}
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
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {tab.label}
                    </Button>
                  );
                })}
              </Stack>

              {/* DESCRIPTION */}
              <Typography>
                Chương trình cố vấn hoàn toàn mới dành cho các bạn Sinh viên muốn
                tìm các anh chị Cựu sinh viên để hỗ trợ mình trong học tập và trong công việc.
              </Typography>

              {/* STATS */}
              <Box
                sx={{
                  backgroundColor: 'primary.main',
                  borderRadius: 1,
                  px: { xs: 3, md: 6 },
                  py: { xs: 3, md: 4 },
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr 1fr 1fr',
                  },
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

              {/* SEARCH */}
              <Box>
                <Typography variant="h3" fontWeight={700} mb={2}>
                  Đề xuất cho bạn
                </Typography>

                <TextField
                  fullWidth
                  placeholder="Tìm kiếm cố vấn..."
                  InputProps={{
                    startAdornment: (
                      <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    ),
                  }}
                  sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                />
              </Box>

              {/* ================= MENTOR CARDS ================= */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 1fr 1fr',
                  },
                  gap: 3,
                }}
              >
                {MOCK_MENTORS.map((mentor, i) => (
                  <Card
                    key={i}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: 'none',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                    }}
                  >
                    <Stack spacing={2} alignItems="center">

                      {/* AVATAR */}
                      <Avatar
                        src={mentor.avatar}
                        sx={{ width: 80, height: 80 }}
                      />

                      {/* NAME */}
                      <Typography fontWeight={700}>
                        {mentor.name}
                      </Typography>

                      {/* ROLE */}
                      <Typography variant="body2" color="text.secondary">
                        {mentor.role}
                      </Typography>

                      {/* RATING */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StarIcon sx={{ color: '#FFC107', fontSize: 18 }} />
                        <Typography fontWeight={700} color="primary.main">
                          {mentor.rating}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({mentor.reviews} reviews)
                        </Typography>
                      </Box>

                      {/* TAGS */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          gap: 1,
                        }}
                      >
                        {mentor.tags.map((tag, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: 999,
                              backgroundColor: 'primary.lighter',
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="primary.main"
                              fontWeight={600}
                            >
                              #{tag}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                    </Stack>

                    {/* BUTTON */}
                    <Button
                      variant="contained"
                      sx={{ mt: 3 }}
                      fullWidth
                    >
                      Xem Profile
                    </Button>
                  </Card>
                ))}
              </Box>

            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default MentorshipPage;
