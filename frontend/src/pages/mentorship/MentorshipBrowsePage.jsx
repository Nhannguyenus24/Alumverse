import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSnackbar } from 'notistack';

import Page from '../../components/Page';
import Sidebar from '../../components/Sidebar';
import SearchBar from '../../components/SearchBar';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import MentorshipCard from '../../components/mentorship/MentorshipCard';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import MentorshipHubActions from '../../components/mentorship/MentorshipHubActions';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useBrowseMentors } from '../../hooks/mentorship/useBrowseMentors';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { useExpertiseTopics } from '../../hooks/mentorship/useExpertiseTopics';
import { useExpertiseCategories } from '../../hooks/mentorship/useExpertiseCategories';
import { formatRating } from '../../utils/numberFormatter';
import { MENTORSHIP_LANDING, MENTORSHIP_SIDEBAR } from '../../constants/mentorshipNav';

const PAGE_SIZE = 9;

const startOfDayIso = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : '');
const endOfDayIso = (dateStr) => (dateStr ? `${dateStr}T23:59:59` : '');

const MentorshipBrowsePage = () => {
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

  const access = useMentorshipAccessState();
  const ownMentorMemberId = access.mentorMemberId;
  const browseEnabled = access.canPreviewMentors;

  const categoriesQuery = useExpertiseCategories({ enabled: browseEnabled });
  const categoryOptions = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const topicsQuery = useExpertiseTopics({ enabled: browseEnabled });
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
    enabled: browseEnabled,
  });
  const paginated = browseQuery.data;
  const mentors = useMemo(() => paginated?.items ?? [], [paginated]);

  const handleViewProfile = (mentorMemberId) =>
    navigate(`/development/mentorship/mentors/${mentorMemberId}`);

  const handleBook = (mentorMemberId) => {
    if (!access.canUseMentorship) {
      enqueueSnackbar('Bạn cần xác minh thông tin học vấn tại khoa để đặt lịch.', {
        variant: 'warning',
      });
      navigate('/settings/account');
      return;
    }
    navigate(`/development/mentorship/mentors/${mentorMemberId}/book`);
  };

  const bookDisabledReason = !access.canUseMentorship
    ? 'Cần xác minh học vấn để đặt lịch'
    : undefined;

  return (
    <Page title="Tìm cố vấn">
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
              <Sidebar items={MENTORSHIP_SIDEBAR} />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Stack spacing={3} sx={{ flex: 1, minWidth: 0, px: { xs: 1.5, sm: 2, md: 2.75 } }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(MENTORSHIP_LANDING)}
                sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                color="inherit"
              >
                Về trang giới thiệu
              </Button>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Typography variant="h1" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}>
                  TÌM CỐ VẤN
                </Typography>
                <MentorshipHubActions />
              </Box>

              {access.needsOrgVerification && (
                <Alert severity="info">
                  Bạn đang xem ở chế độ xem trước. Hoàn tất xác minh học vấn tại khoa để đặt lịch với cố vấn.
                </Alert>
              )}

              <SearchBar
                value={searchQuery}
                onChange={(v) => {
                  setSearchQuery(v);
                  setPage(0);
                }}
                placeholder="Tìm theo tên, chức danh, công ty hoặc bio..."
              />

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
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                    gap: 3,
                  }}
                >
                  {mentors.map((mentor) => {
                    const isOwnCard = ownMentorMemberId === mentor.memberId;
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
                        canBook={access.canUseMentorship && !isOwnCard}
                        bookDisabledReason={
                          isOwnCard ? 'Đây là hồ sơ của bạn' : bookDisabledReason
                        }
                      />
                    );
                  })}
                </Box>
              )}

              {paginated && paginated.totalPage > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
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

export default MentorshipBrowsePage;
