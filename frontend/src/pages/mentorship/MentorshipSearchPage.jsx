import { useState, useMemo } from 'react';
import { 
  Box, Button, Container, Stack, Typography, TextField, InputAdornment 
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

import Page from '../../components/Page';
import Sidebar from '../../components/Sidebar';
import TopTabFilter from '../../components/TopTabFilter';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import MentorshipCard from "../../components/mentorship/MentorshipCard";
import DynamicFilterBar from '../../components/DynamicFilterBar'; // Imported
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

// Configuration for the Dynamic Filter Bar
const MENTORSHIP_FILTERS = [
  {
    type: 'dropdown',
    key: 'topics',
    label: 'Chủ đề',
    multiple: true,
    options: ['Frontend', 'Backend', 'Career', 'Interview', 'Startup'],
  },
  {
    type: 'dropdown',
    key: 'expertise',
    label: 'Chuyên môn',
    multiple: true,
    options: ['Web', 'Mobile', 'AI', 'Data', 'DevOps'],
  },
  {
    type: 'topics', // Using the button-style toggle for "Trending"
    key: 'status',
    options: ['Thịnh hành'],
  },
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

const MentorshipSearchPage = () => {
  const navigate = useOrgNavigate();
  
  // Unified state for DynamicFilterBar
  const [filters, setFilters] = useState({
    all: true,
    topics: [],
    expertise: [],
    status: [],
    search: '',
  });

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(1);
  const paginatedMentors = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return MOCK_MENTORS.slice(start, start + ITEMS_PER_PAGE);
  }, [page]);
  const totalPages = Math.ceil(MOCK_MENTORS.length / ITEMS_PER_PAGE);

  return (
    <Page title="Cố vấn - Tìm kiếm">
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

            {/* MAIN CONTENT */}
            <Stack spacing={4} sx={{ flex: 1, minWidth: 0, width: '100%', px: { xs: 1.5, sm: 2, md: 2.75 } }}>
              
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
                  Kết nối với hơn 500+ cố vấn khắp mọi miền đất nước.
                </Typography>
              </Stack>

              <Stack spacing={3}>
                <Typography variant="h4" fontWeight={700}>
                  Tìm kiếm
                </Typography>

                {/* REPLACED: NEW DYNAMIC FILTER BAR */}
                <DynamicFilterBar 
                  config={MENTORSHIP_FILTERS} 
                  value={filters} 
                  onChange={setFilters} 
                />

                {/* SEARCH INPUT */}
                <TextField
                  fullWidth
                  value={filters.search}
                  onChange={handleSearchChange}
                  placeholder="Tìm kiếm cố vấn theo tên, công ty hoặc kỹ năng..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ bgcolor: 'background.paper' }}
                />
              </Stack>

              {/* MENTOR CARDS GRID */}
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
                  <MentorshipCard
                    key={i}
                    avatar={mentor.avatar}
                    name={mentor.name}
                    role={mentor.role}
                    rating={mentor.rating}
                    reviews={mentor.reviews}
                    tags={mentor.tags}
                    onViewProfile={() => console.log('View profile', mentor.name)}
                  />
                ))}
              </Box>

              {/* PAGINATION CONTROLS */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 1,
                  mt: 4,
                }}
              >
                <Button
                  variant="outlined"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trước
                </Button>

                <Typography sx={{ display: "flex", alignItems: "center", px: 2 }}>
                  {page} / {totalPages}
                </Typography>

                <Button
                  variant="outlined"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default MentorshipSearchPage;