import { useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

import Page from '../../components/Page';
import Sidebar from '../../components/Sidebar';
import SearchBar from '../../components/SearchBar';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import MentorshipCard from "../../components/mentorship/MentorshipCard";
import DynamicFilterBar from '../../components/DynamicFilterBar';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useBrowseMentors } from '../../hooks/mentorship/useBrowseMentors';
import { formatRating } from '../../utils/numberFormatter';


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

/* ================= COMPONENT ================= */

const PAGE_SIZE = 9;

const MentorshipPage = () => {
  const navigate = useOrgNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  const [filters, setFilters] = useState({
    all: true,
    topics: [],
    expertise: [],
    status: [],
    search: '',
  });

  const expertiseFilter = useMemo(() => {
    const all = [...(filters.topics ?? []), ...(filters.expertise ?? [])];
    return all[0] ?? '';
  }, [filters.topics, filters.expertise]);

  const hasAvailability = (filters.status ?? []).includes('Thịnh hành');

  const browseQuery = useBrowseMentors({
    keyword: searchQuery,
    expertise: expertiseFilter,
    hasAvailability,
    page,
    limit: PAGE_SIZE,
  });
  const paginated = browseQuery.data;
  const mentors = useMemo(() => paginated?.items ?? [], [paginated]);

  // Ví dụ: đã là Alumni và đã là Mentor
  const user = { isAlumni: true, isMentor: true };
  const { isAlumni, isMentor } = user;

  // Hàm render nút bấm dựa trên điều kiện
  const renderActionButtons = () => {
    const myBookingsBtn = (
      <Button
        variant="outlined"
        onClick={() => navigate('/development/mentorship/my-bookings')}
      >
        Lịch hẹn của tôi
      </Button>
    );

    // Trường hợp 3: Không phải Alumni -> chỉ hiện "Lịch hẹn của tôi"
    if (!isAlumni) return myBookingsBtn;

    // Trường hợp 2: Là Alumni + Đã là Mentor -> "Trang cá nhân" + "Lịch hẹn của tôi"
    if (isMentor) {
      return (
        <Stack direction="row" spacing={1.5}>
          {myBookingsBtn}
          <Button
            variant="outlined"
            onClick={() => navigate('/development/mentorship/profile')}
          >
            Trang cá nhân
          </Button>
        </Stack>
      );
    }

    // Trường hợp 1: Là Alumni + Chưa là Mentor -> "Lịch hẹn của tôi" + "Trở thành cố vấn"
    return (
      <Stack direction="row" spacing={1.5}>
        {myBookingsBtn}
        <Button
          variant="contained"
          onClick={() => navigate('/development/mentorship/signup')}
        >
          Trở thành cố vấn
        </Button>
      </Stack>
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
                  onChange={(v) => {
                    setSearchQuery(v);
                    setPage(0);
                  }}
                  placeholder="Tìm kiếm cố vấn theo công ty, chức danh hoặc bio..."
                />
              </Box>

              <DynamicFilterBar
                config={MENTORSHIP_FILTERS}
                value={filters}
                onChange={(next) => {
                  setFilters(next);
                  setPage(0);
                }}
              />

              {/* MENTOR CARDS GRID */}
              {browseQuery.isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : browseQuery.isError ? (
                <Alert severity="error">Không tải được danh sách cố vấn. Vui lòng thử lại.</Alert>
              ) : mentors.length === 0 ? (
                <Alert severity="info">
                  {searchQuery.trim()
                    ? `Không tìm thấy cố vấn nào khớp "${searchQuery}".`
                    : 'Chưa có cố vấn nào trong hệ thống.'}
                </Alert>
              ) : (
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
                  {mentors.map((mentor) => (
                    <MentorshipCard
                      key={mentor.memberId}
                      avatar={mentor.avatarUrl}
                      name={mentor.fullName ?? `Mentor #${mentor.memberId}`}
                      role={
                        [mentor.currentJobTitle, mentor.currentCompany]
                          .filter(Boolean)
                          .join(' @ ') || 'Cố vấn'
                      }
                      rating={formatRating(mentor.ratingAvg)}
                      reviews={mentor.totalSessions ?? 0}
                      tags={(mentor.expertiseTopics ?? []).slice(0, 3)}
                      onViewProfile={() =>
                        navigate(`/development/mentorship/mentors/${mentor.memberId}/book`)
                      }
                    />
                  ))}
                </Box>
              )}

              {/* PAGINATION CONTROLS */}
              {paginated && paginated.totalPage > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 4 }}>
                  <Button
                    variant="outlined"
                    disabled={!paginated.hasPrevious}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Trước
                  </Button>
                  <Typography sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                    {paginated.currentPage + 1} / {paginated.totalPage}
                  </Typography>
                  <Button
                    variant="outlined"
                    disabled={!paginated.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </Box>
              )}

            </Stack>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default MentorshipPage;