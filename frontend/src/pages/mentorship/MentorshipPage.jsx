import { useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

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
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyMenteeProfile } from '../../hooks/mentorship/useMyMenteeProfile';
import { useExpertiseTopics } from '../../hooks/mentorship/useExpertiseTopics';
import { useExpertiseCategories } from '../../hooks/mentorship/useExpertiseCategories';
import useAuthStore from '../../stores/authStore';
import { formatRating } from '../../utils/numberFormatter';


const SIDEBAR = [
  { id: '/development', label: 'Phát triển', icon: <TrendingUpIcon /> },
  { id: '/development/mentorship', label: 'Cố vấn', icon: <SchoolIcon /> },
  { id: '/development/academics', label: 'Cơ hội học tập', icon: <MenuBookIcon /> },
  { id: '/development/jobs', label: 'Cơ hội việc làm', icon: <WorkIcon /> },
];

const STATS = [
  { value: '500+', label: 'cố vấn' },
  { value: '2,000+', label: 'buổi họp' },
  { value: '100%', label: 'alumni đã xác nhận' },
];

const PAGE_SIZE = 9;

const startOfDayIso = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : '');
const endOfDayIso = (dateStr) => (dateStr ? `${dateStr}T23:59:59` : '');

const MentorshipPage = () => {
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  const [filters, setFilters] = useState({
    all: true,
    categories: [],
    topics: [],
    status: [],
    availableOn: '',
  });

  const authUser = useAuthStore((state) => state.user);
  const isLoggedIn = Boolean(authUser?.id);

  const mentorProfileQuery = useMyMentorProfile();
  const menteeProfileQuery = useMyMenteeProfile();
  const isMentor = Boolean(mentorProfileQuery.data && !mentorProfileQuery.isError);
  const hasMenteeProfile = Boolean(menteeProfileQuery.data && !menteeProfileQuery.isError);
  const ownMentorMemberId = mentorProfileQuery.data?.memberId ?? null;

  const categoriesQuery = useExpertiseCategories();
  const categoryOptions = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const topicsQuery = useExpertiseTopics();
  const topicOptions = useMemo(() => topicsQuery.data ?? [], [topicsQuery.data]);

  const MENTORSHIP_FILTERS = useMemo(
    () => [
      {
        type: 'dropdown',
        key: 'categories',
        label: 'Lĩnh vực',
        multiple: true,
        options: categoryOptions,
      },
      {
        type: 'dropdown',
        key: 'topics',
        label: 'Chủ đề',
        multiple: true,
        options: topicOptions,
      },
      {
        type: 'date',
        key: 'availableOn',
        label: 'Ngày rảnh',
      },
      {
        type: 'topics',
        key: 'status',
        options: ['Thịnh hành'],
      },
    ],
    [categoryOptions, topicOptions],
  );

  const categoryFilter = useMemo(() => (filters.categories ?? [])[0] ?? '', [filters.categories]);
  const expertiseFilter = useMemo(() => (filters.topics ?? [])[0] ?? '', [filters.topics]);

  const hasAvailability = (filters.status ?? []).includes('Thịnh hành');
  const availableFrom = startOfDayIso(filters.availableOn);
  const availableTo = endOfDayIso(filters.availableOn);

  const browseQuery = useBrowseMentors({
    keyword: searchQuery,
    category: categoryFilter,
    expertise: expertiseFilter,
    hasAvailability,
    availableFrom,
    availableTo,
    page,
    limit: PAGE_SIZE,
  });
  const paginated = browseQuery.data;
  const mentors = useMemo(() => paginated?.items ?? [], [paginated]);

  const goToLogin = () => navigate('/auth/login');

  const handleViewProfile = (mentorMemberId) =>
    navigate(`/development/mentorship/mentors/${mentorMemberId}`);

  const handleBook = (mentorMemberId) => {
    if (!isLoggedIn) {
      enqueueSnackbar('Vui lòng đăng nhập để đặt lịch với cố vấn.', { variant: 'info' });
      goToLogin();
      return;
    }
    navigate(`/development/mentorship/mentors/${mentorMemberId}/book`);
  };

  const renderActionButtons = () => {
    if (!isLoggedIn) {
      return (
        <Button variant="contained" onClick={goToLogin}>
          Đăng nhập để bắt đầu
        </Button>
      );
    }

    const myBookingsBtn = (
      <Button
        variant="outlined"
        onClick={() => navigate('/development/mentorship/my-bookings')}
      >
        Lịch hẹn của tôi
      </Button>
    );

    if (mentorProfileQuery.isLoading) {
      return myBookingsBtn;
    }

    const menteeBtn = (
      <Button
        variant={hasMenteeProfile ? 'outlined' : 'contained'}
        onClick={() => navigate('/development/mentorship/mentee-signup')}
      >
        {hasMenteeProfile ? 'Cập nhật Mentee Profile' : 'Trở thành Mentee'}
      </Button>
    );

    if (isMentor) {
      return (
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          {myBookingsBtn}
          <Button
            variant="outlined"
            onClick={() => navigate('/development/mentorship/profile')}
          >
            Trang cá nhân
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/development/mentorship/dashboard')}
          >
            Duyệt yêu cầu
          </Button>
        </Stack>
      );
    }

    return (
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {myBookingsBtn}
        {menteeBtn}
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
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
              <Sidebar items={SIDEBAR} />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Stack spacing={4} sx={{ flex: 1, minWidth: 0, width: '100%', px: { xs: 1.5, sm: 2, md: 2.75 } }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                  <Typography
                    variant="h1"
                    fontWeight={800}
                    color="primary.main"
                    sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
                  >
                    CỐ VẤN
                  </Typography>

                  {renderActionButtons()}
                </Box>

                <Typography color="text.secondary">
                  Chương trình cố vấn hoàn toàn mới dành cho các bạn Sinh viên muốn
                  tìm các anh chị Cựu sinh viên để hỗ trợ mình trong học tập và trong công việc.
                </Typography>
              </Stack>

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
                  placeholder="Tìm theo tên, chức danh, công ty hoặc bio..."
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
                  {mentors.map((mentor) => {
                    const isOwnCard = ownMentorMemberId === mentor.memberId;
                    const bookDisabledReason = !isLoggedIn
                      ? 'Đăng nhập để đặt lịch'
                      : isOwnCard
                        ? 'Đây là hồ sơ của bạn'
                        : undefined;

                    return (
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
                        onViewProfile={() => handleViewProfile(mentor.memberId)}
                        onBook={() => handleBook(mentor.memberId)}
                        canBook={isLoggedIn && !isOwnCard}
                        bookDisabledReason={bookDisabledReason}
                      />
                    );
                  })}
                </Box>
              )}

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
