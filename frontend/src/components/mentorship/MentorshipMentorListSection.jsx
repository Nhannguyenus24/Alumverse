import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';

import SearchBar from '../SearchBar';
import MentorshipCard from './MentorshipCard';
import DynamicFilterBar from '../DynamicFilterBar';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useBrowseMentors } from '../../hooks/mentorship/useBrowseMentors';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { useExpertiseTopics } from '../../hooks/mentorship/useExpertiseTopics';
import { useExpertiseCategories } from '../../hooks/mentorship/useExpertiseCategories';
import { formatRating } from '../../utils/numberFormatter';

const PAGE_SIZE = 9;

const startOfDayIso = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : '');
const endOfDayIso = (dateStr) => (dateStr ? `${dateStr}T23:59:59` : '');

const MentorshipMentorListSection = () => {
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

  const filterConfig = useMemo(
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
    <Stack spacing={3}>
      {access.needsOrgVerification && (
        <Alert severity="info">
          Bạn đang xem ở chế độ xem trước. Hoàn tất xác minh học vấn tại khoa để đặt lịch với cố vấn.
        </Alert>
      )}

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
          placeholder="Tìm theo tên, chức danh, công ty hoặc giới thiệu..."
        />
      </Box>

      <DynamicFilterBar
        config={filterConfig}
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
                bookDisabledReason={isOwnCard ? 'Đây là hồ sơ của bạn' : bookDisabledReason}
              />
            );
          })}
        </Box>
      )}

      {paginated && paginated.totalPage > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
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
  );
};

export default MentorshipMentorListSection;
