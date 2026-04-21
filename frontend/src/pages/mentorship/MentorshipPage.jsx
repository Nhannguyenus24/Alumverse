import { useMemo, useState } from "react";
import { Box, Button, Container, Stack, Typography } from '@mui/material';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

import Page from '../../components/Page';
import Sidebar from '../../components/Sidebar';
import SearchBar from '../../components/SearchBar';
import TopTabFilter from '../../components/TopTabFilter';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import MentorshipCard from "../../components/mentorship/MentorshipCard";
import DynamicFilterBar from '../../components/DynamicFilterBar';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';


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
  { value: '500+', label: 'cố vấn' },
  { value: '2,000+', label: 'buổi họp' },
  { value: '100%', label: 'alumni đã xác nhận' },
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

const MentorshipPage = () => {
  const navigate = useOrgNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
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


  // Ví dụ: đã là Alumni và đã là Mentor
  const user = { isAlumni: true, isMentor: true };
  const { isAlumni, isMentor } = user;

  // Hàm render nút bấm dựa trên điều kiện
  const renderActionButtons = () => {
    // Trường hợp 3: Không phải Alumni -> Ẩn nút
    if (!isAlumni) return null;

    // Trường hợp 2: Là Alumni + Đã là Mentor -> "Trang cá nhân" (Outlined)
    if (isMentor) {
      return (
        <Button 
          variant="outlined" 
          onClick={() => navigate('/development/mentorship/profile')}
        >
          Trang cá nhân
        </Button>
      );
    }

    // Trường hợp 1: Là Alumni + Chưa là Mentor -> "Trở thành cố vấn" (Contained)
    return (
      <Button 
        variant="contained" 
        onClick={() => navigate('/development/mentorship/signup')}
      >
        Trở thành cố vấn
      </Button>
    );
  };

  return (
    <Page title="Cố vấn">
      <Container maxWidth={false} disableGutters sx={{ pb: 6 }}>
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2, md: 3 },
            }}
          >
            {/* SIDEBAR - Matches Development UI */}
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

                  {/* GỌI HÀM RENDER NÚT TẠI ĐÂY */}
                  {renderActionButtons()}
                </Box>

                <Typography color="text.secondary">
                  Chương trình cố vấn hoàn toàn mới dành cho các bạn Sinh viên muốn
                  tìm các anh chị Cựu sinh viên để hỗ trợ mình trong học tập và trong công việc.
                </Typography>
              </Stack>

              {/* STATS BANNER */}
              <Box
                sx={{
                  backgroundColor: 'primary.main',
                  borderRadius: 2,
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
                    <Typography variant="body2" color="common.white" sx={{ opacity: 0.9 }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* SEARCH - Using SearchBar from UI kit */}
              <Box>
                <Typography variant="h4" fontWeight={700} mb={2}>
                  Tìm kiếm cố vấn
                </Typography>
                <SearchBar 
                    value={searchQuery} 
                    onChange={setSearchQuery} 
                    placeholder="Tìm kiếm cố vấn theo tên, công ty hoặc kỹ năng..."
                />
              </Box>

              {/* REPLACED: NEW DYNAMIC FILTER BAR */}
              <DynamicFilterBar 
                config={MENTORSHIP_FILTERS} 
                value={filters} 
                onChange={setFilters} 
              />

              {/* MENTOR CARDS GRID */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                    md: "1fr 1fr 1fr",
                  },
                  gap: 3,
                }}
              >
                {paginatedMentors.map((mentor, i) => (
                  <MentorshipCard
                    key={i}
                    avatar={mentor.avatar}
                    name={mentor.name}
                    role={mentor.role}
                    rating={mentor.rating}
                    reviews={mentor.reviews}
                    tags={mentor.tags}
                    onViewProfile={() => console.log("View profile", mentor.name)}
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

export default MentorshipPage;