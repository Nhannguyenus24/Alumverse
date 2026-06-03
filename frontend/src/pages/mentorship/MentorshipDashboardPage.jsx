import { useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';

import StarIcon from '@mui/icons-material/Star';

import Page from '../../components/Page';
import MentorshipProfileLayout from '../../layouts/ProfileLayout';
import MentorshipBookingItem from '../../components/mentorship/MentorshipBookingItem';
import MentorshipReviewCard from '../../components/mentorship/MentorshipReviewCard';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyMentorSessions } from '../../hooks/mentorship/useMyMentorSessions';
import { useUpdateSessionStatus } from '../../hooks/mentorship/useUpdateSessionStatus';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyMentorFeedbacks } from '../../hooks/mentorship/useMyMentorFeedbacks';
import { formatDate } from '../../utils/dateFormatter';
import { formatRating } from '../../utils/numberFormatter';

const TOP_TABS = [
  { label: 'Trang cá nhân', path: '/development/mentorship/profile' },
  { label: 'Dashboard', path: '/development/mentorship/dashboard' },
  { label: 'Lịch cá nhân', path: '/development/mentorship/calendar' },
];

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

const PAGE_SIZE = 50;

const MentorshipDashboardPage = () => {
  const navigate = useOrgNavigate();

  const profileQuery = useMyMentorProfile();
  const sessionsQuery = useMyMentorSessions({ page: 0, limit: PAGE_SIZE });
  const feedbacksQuery = useMyMentorFeedbacks(0, 50);
  const updateMutation = useUpdateSessionStatus();

  const items = useMemo(() => sessionsQuery.data?.items ?? [], [sessionsQuery.data]);
  const feedbacks = useMemo(
    () => feedbacksQuery.data?.items ?? [],
    [feedbacksQuery.data],
  );

  const upcomingItems = useMemo(
    () => items.filter((s) => s.status === 'CONFIRMED'),
    [items],
  );

  const stats = useMemo(() => {
    const completed = items.filter((s) => s.status === 'COMPLETED').length;
    return [
      { value: items.length, label: 'lượt đặt' },
      { value: upcomingItems.length, label: 'sắp tới' },
      { value: completed, label: 'đã hoàn thành' },
    ];
  }, [items, upcomingItems]);

  const callUpdate = async (sessionId, status) => {
    try {
      await updateMutation.updateStatus({ sessionId, status });
    } catch {
      /* surfaced via errorMessage */
    }
  };

  const profile = profileQuery.data;
  const user = {
    name: profile?.fullName ?? 'Tài khoản của tôi',
    role:
      profile && (profile.currentJobTitle || profile.currentCompany)
        ? [profile.currentJobTitle, profile.currentCompany].filter(Boolean).join(' @ ')
        : 'Mentor',
    avatar: profile?.avatarUrl ?? '',
    cover: profile?.coverUrl ?? DEFAULT_COVER,
  };

  const ratingAvg = formatRating(profile?.ratingAvg);

  return (
    <Page title="Cố vấn - Dashboard">
      <MentorshipProfileLayout
        user={user}
        cover={user.cover}
        tabs={TOP_TABS}
        onNavigate={navigate}
        mode="mentor"
      >
        <Stack spacing={4}>
          <Typography variant="h2" fontWeight={800} color="primary.main">
            DASHBOARD
          </Typography>

          {/* STATS */}
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
            {stats.map((item, i) => (
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

          {updateMutation.errorMessage && (
            <Alert severity="error">{updateMutation.errorMessage}</Alert>
          )}

          {sessionsQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : sessionsQuery.isError ? (
            <Alert severity="error">Không tải được danh sách buổi tư vấn.</Alert>
          ) : (
            <>
              {/* LỊCH SẮP TỚI */}
              <Section title={`Lịch sắp tới (${upcomingItems.length})`}>
                {upcomingItems.length === 0 ? (
                  <EmptyState message="Bạn chưa có buổi tư vấn nào sắp tới." />
                ) : (
                  <Stack spacing={2}>
                    {upcomingItems.map((session) => (
                      <Box key={session.id}>
                        <MentorshipBookingItem session={session} view="mentor" />
                        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 0.5 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => callUpdate(session.id, 'COMPLETED')}
                          >
                            Đánh dấu hoàn tất
                          </Button>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Section>
            </>
          )}

          {/* ĐÁNH GIÁ */}
          <Section
            title="Đánh giá"
            right={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <StarIcon sx={{ color: 'warning.main' }} />
                <Typography fontWeight={700}>{ratingAvg}</Typography>
                <Typography color="text.secondary">({feedbacks.length} đánh giá)</Typography>
              </Box>
            }
          >
            {feedbacksQuery.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={20} />
              </Box>
            ) : feedbacks.length === 0 ? (
              <EmptyState message="Chưa có đánh giá nào từ mentee." />
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {feedbacks.map((review) => (
                  <MentorshipReviewCard
                    key={review.id}
                    name={review.menteeName ?? `Mentee #${review.menteeMemberId}`}
                    date={formatDate(review.createdAt, '')}
                    avatar={review.menteeAvatarUrl ?? ''}
                    rating={review.rating}
                    content={review.comment ?? ''}
                  />
                ))}
              </Box>
            )}
          </Section>
        </Stack>
      </MentorshipProfileLayout>
    </Page>
  );
};

const Section = ({ title, children, right }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h4" fontWeight={700} color="primary.main">
        {title}
      </Typography>
      {right}
    </Box>
    {children}
  </Box>
);

const EmptyState = ({ message }) => (
  <Card sx={{ p: 3, border: '1px dashed', borderColor: 'divider', textAlign: 'center' }} elevation={0}>
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Card>
);

export default MentorshipDashboardPage;
