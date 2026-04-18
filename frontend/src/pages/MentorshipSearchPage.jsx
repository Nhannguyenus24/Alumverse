import { useState } from 'react';
import { useLocation } from 'react-router';
import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  Card,
  Avatar,
  Select,
  MenuItem,
  Checkbox,
  ListItemText
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import StarIcon from '@mui/icons-material/Star';

import Page from '../components/Page';
import ForumFilterPanel from '../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../components/forum/ForumSponsoredCard';
import { useOrgNavigate } from '../hooks/useOrgNavigate';

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

const MOCK_MENTORS = Array(6).fill({
  name: 'Nguyễn Lê Hoàng Dũng',
  role: 'Senior Software Engineer @ Google',
  rating: 4.9,
  reviews: 124,
  tags: ['Frontend', 'Career', 'Interview'],
  avatar: 'https://i.pravatar.cc/150?img=3',
});

const TOPICS = ['Frontend', 'Backend', 'Career', 'Interview', 'Startup'];
const EXPERTISE = ['Web', 'Mobile', 'AI', 'Data', 'DevOps'];
const AVAILABILITY = ['Sáng', 'Chiều', 'Tối', 'Cuối tuần'];

/* ================= COMPONENT ================= */

const MentorshipSearchPage = () => {
  const navigate = useOrgNavigate();
  const location = useLocation();

  const [selectedSidebar, setSelectedSidebar] = useState('mentorship');
  const [topics, setTopics] = useState([]);
  const [expertise, setExpertise] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [activeFilters, setActiveFilters] = useState(['all']);

  const toggleFilter = (id) => {
    if (id === 'all') {
      setActiveFilters(['all']);
      return;
    }

    setActiveFilters((prev) => {
      const filtered = prev.filter((f) => f !== 'all');

      if (filtered.includes(id)) {
        const next = filtered.filter((f) => f !== id);
        return next.length === 0 ? ['all'] : next;
      }

      return [...filtered, id];
    });
  };

  return (
    <Page title="Cố vấn - Tìm kiếm">
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
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>

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

            {/* MAIN */}
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
                Kết nối với hơn 500+ cố vấn khắp mọi miền đất nước.
              </Typography>

              <Typography variant="h3" fontWeight={700}>
                Tìm kiếm
              </Typography>

              {/* FILTERS */}
              <Stack direction="row" spacing={1.5} flexWrap="wrap">

                {/* ALL */}
                <Button
                  variant={activeFilters.includes('all') ? 'contained' : 'outlined'}
                  onClick={() => toggleFilter('all')}
                >
                  Tất cả
                </Button>

                {/* CHỦ ĐỀ */}
                <Select
                  multiple
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  displayEmpty
                  renderValue={(selected) =>
                    selected.length === 0 ? 'Chủ đề' : selected.join(', ')
                  }
                  sx={{ minWidth: 140 }}
                >
                  {TOPICS.map((item) => (
                    <MenuItem key={item} value={item}>
                      <Checkbox checked={topics.includes(item)} />
                      <ListItemText primary={item} />
                    </MenuItem>
                  ))}
                </Select>

                {/* CHUYÊN MÔN */}
                <Select
                  multiple
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  displayEmpty
                  renderValue={(selected) =>
                    selected.length === 0 ? 'Chuyên môn' : selected.join(', ')
                  }
                  sx={{ minWidth: 150 }}
                >
                  {EXPERTISE.map((item) => (
                    <MenuItem key={item} value={item}>
                      <Checkbox checked={expertise.includes(item)} />
                      <ListItemText primary={item} />
                    </MenuItem>
                  ))}
                </Select>

                {/* THỜI GIAN TRỐNG */}
                <Select
                  multiple
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  displayEmpty
                  renderValue={(selected) =>
                    selected.length === 0 ? 'Thời gian trống' : selected.join(', ')
                  }
                  sx={{ minWidth: 180 }}
                >
                  {AVAILABILITY.map((item) => (
                    <MenuItem key={item} value={item}>
                      <Checkbox checked={availability.includes(item)} />
                      <ListItemText primary={item} />
                    </MenuItem>
                  ))}
                </Select>

                {/* THỊNH HÀNH */}
                <Button
                  variant={activeFilters.includes('trending') ? 'contained' : 'outlined'}
                  onClick={() => toggleFilter('trending')}
                >
                  Thịnh hành
                </Button>

              </Stack>

              {/* SEARCH */}
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

              {/* CARDS */}
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
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Stack spacing={2} alignItems="center">

                      <Avatar src={mentor.avatar} sx={{ width: 80, height: 80 }} />

                      <Typography fontWeight={700}>
                        {mentor.name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        {mentor.role}
                      </Typography>

                      <Box display="flex" alignItems="center" gap={0.5}>
                        <StarIcon sx={{ color: '#FFC107', fontSize: 18 }} />
                        <Typography fontWeight={700} color="primary.main">
                          {mentor.rating}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({mentor.reviews})
                        </Typography>
                      </Box>

                      <Box display="flex" flexWrap="wrap" justifyContent="center" gap={1}>
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
                            <Typography variant="caption" color="primary.main">
                              #{tag}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                    </Stack>

                    <Button variant="contained" sx={{ mt: 3 }} fullWidth>
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

export default MentorshipSearchPage;