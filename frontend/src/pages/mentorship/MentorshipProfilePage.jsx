import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

import Page from '../../components/Page';
import MentorshipProfileLayout from '../../layouts/MentorshipProfileLayout';
import MentorshipTag from '../../components/mentorship/MentorshipTag';
import MentorshipReviewCard from '../../components/mentorship/MentorshipReviewCard';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyExpertise } from '../../hooks/mentorship/useMyExpertise';
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

const ITEMS_PER_PAGE = 3;

const CATEGORY_LABEL = {
  CAREER: 'Định hướng nghề nghiệp',
  ACADEMIC: 'Học tập / Học bổng',
  SOFT_SKILLS: 'Kỹ năng mềm',
  GENERAL: 'Chung',
};

const MentorshipProfilePage = () => {
  const navigate = useOrgNavigate();

  const profileQuery = useMyMentorProfile();
  const expertiseQuery = useMyExpertise();
  const feedbacksQuery = useMyMentorFeedbacks(0, 50);

  const [page, setPage] = useState(1);

  const profile = profileQuery.data;
  const expertise = useMemo(() => expertiseQuery.data ?? [], [expertiseQuery.data]);
  const feedbacks = useMemo(
    () => feedbacksQuery.data?.items ?? [],
    [feedbacksQuery.data],
  );

  const stats = useMemo(
    () => [
      { value: expertise.length, label: 'lĩnh vực chia sẻ' },
      {
        value: profile?.totalSessions ?? 0,
        label: 'buổi đã hoàn thành',
      },
      {
        value: formatRating(profile?.ratingAvg),
        label: 'đánh giá trung bình',
      },
      { value: feedbacks.length, label: 'phản hồi' },
    ],
    [profile, expertise, feedbacks],
  );

  const tags = useMemo(
    () => expertise.map((e) => e.tag || e.topic).filter(Boolean),
    [expertise],
  );

  const totalPages = Math.max(1, Math.ceil(feedbacks.length / ITEMS_PER_PAGE));
  const paginatedReviews = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return feedbacks.slice(start, start + ITEMS_PER_PAGE);
  }, [feedbacks, page]);

  // ===== Loading / no-profile gating =====

  if (profileQuery.isLoading) {
    return (
      <Page title="Profile Cố vấn">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <Page title="Profile Cố vấn">
        <Box sx={{ maxWidth: 720, mx: 'auto', py: 6, px: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography fontWeight={700} mb={0.5}>
              Bạn chưa có hồ sơ cố vấn
            </Typography>
            <Typography variant="body2">
              Hãy đăng ký để bắt đầu chia sẻ kinh nghiệm với các bạn sinh viên và cựu sinh viên.
            </Typography>
          </Alert>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate('/development/mentorship')}>
              Về trang Cố vấn
            </Button>
            <Button variant="contained" onClick={() => navigate('/development/mentorship/signup')}>
              Trở thành cố vấn
            </Button>
          </Stack>
        </Box>
      </Page>
    );
  }

  const user = {
    name: profile.fullName ?? `Mentor #${profile.memberId}`,
    role: [profile.currentJobTitle, profile.currentCompany]
      .filter(Boolean)
      .join(' @ ') || 'Cố vấn',
    avatar: profile.avatarUrl ?? '',
    cover: DEFAULT_COVER,
  };

  return (
    <Page title="Profile Cố vấn">
      <MentorshipProfileLayout
        user={user}
        cover={user.cover}
        tabs={TOP_TABS}
        onNavigate={navigate}
        mode="mentor"
      >
        <Stack spacing={4}>
          <Typography variant="h2" fontWeight={800} color="primary.main">
            TRANG CÁ NHÂN
          </Typography>

          {!profile.isApproved && (
            <Alert severity="warning">
              Hồ sơ của bạn đang chờ admin duyệt. Trong thời gian này mentee sẽ chưa thấy bạn ở trang
              tìm cố vấn.
            </Alert>
          )}

          {/* STATS GRID */}
          <Box
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: 2,
              px: { xs: 3, md: 6 },
              py: { xs: 3, md: 4 },
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr 1fr',
              },
              gap: 3,
              textAlign: 'center',
            }}
          >
            {stats.map((item, i) => (
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
        </Stack>

        {/* INTRO SECTION */}
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary.main" mb={1}>
            Giới thiệu
          </Typography>
          <Typography color="text.primary" sx={{ whiteSpace: 'pre-line' }}>
            {profile.bio?.trim() || 'Bạn chưa cập nhật phần giới thiệu.'}
          </Typography>
        </Box>

        {/* EXTENDED PROFILE SECTIONS */}
        <ExtendedProfileSections raw={profile.extendedProfile} />

        {/* CONTENT TO SHARE */}
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
            Nội dung có thể chia sẻ
          </Typography>
          {expertise.length === 0 ? (
            <Typography color="text.secondary">Chưa có nội dung nào.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {expertise.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography fontWeight={600}>{item.topic}</Typography>
                    {item.category && (
                      <Typography variant="caption" color="primary.main">
                        · {CATEGORY_LABEL[item.category] ?? item.category}
                      </Typography>
                    )}
                    {item.tag && (
                      <Typography variant="caption" color="text.secondary">
                        #{item.tag}
                      </Typography>
                    )}
                  </Stack>
                  {item.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: 'pre-line', mt: 0.5 }}
                    >
                      {item.description}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* TAGS */}
        {tags.length > 0 && (
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
              Kỹ năng
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tags.map((tag, idx) => (
                <MentorshipTag key={idx} label={tag} />
              ))}
            </Box>
          </Box>
        )}

        {/* REVIEWS SECTION */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1,
              mb: 2,
            }}
          >
            <Typography variant="h4" fontWeight={700} color="primary.main">
              Đánh giá
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon sx={{ color: 'warning.main', fontSize: 24 }} />
              <Typography variant="h5" fontWeight={700} color="primary.main">
                {formatRating(profile?.ratingAvg)}
              </Typography>
              <Typography color="text.secondary">({feedbacks.length} reviews)</Typography>
            </Box>
          </Box>

          {feedbacks.length === 0 ? (
            <Typography color="text.secondary">Chưa có đánh giá nào.</Typography>
          ) : (
            <>
              <Stack spacing={3}>
                {paginatedReviews.map((review) => (
                  <MentorshipReviewCard
                    key={review.id}
                    name={review.menteeName ?? `Mentee #${review.menteeMemberId}`}
                    date={formatDate(review.createdAt, '')}
                    avatar={review.menteeAvatarUrl ?? ''}
                    rating={review.rating}
                    content={review.comment ?? ''}
                  />
                ))}
              </Stack>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 4 }}>
                  <Button
                    variant="outlined"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Trước
                  </Button>
                  <Typography sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
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
              )}
            </>
          )}
        </Box>
      </MentorshipProfileLayout>
    </Page>
  );
};

const SECTION_LABELS = {
  educations: 'Học vấn',
  experiences: 'Kinh nghiệm làm việc',
  projects: 'Dự án tiêu biểu',
  awards: 'Giải thưởng',
  skills: 'Kỹ năng & chứng chỉ',
};

const ExtendedProfileSections = ({ raw }) => {
  if (!raw) return null;
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const sections = ['educations', 'experiences', 'projects', 'awards', 'skills']
    .map((key) => ({ key, items: Array.isArray(parsed[key]) ? parsed[key] : [] }))
    .filter((s) => s.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map(({ key, items }) => (
        <Box key={key}>
          <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
            {SECTION_LABELS[key]}
          </Typography>
          <Stack spacing={1.5}>
            {items.map((item, idx) => (
              <Box
                key={idx}
                sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
              >
                {Object.entries(item)
                  .filter((entry) => entry[1] != null && String(entry[1]).trim() !== '')
                  .map(([k, v]) => (
                    <Typography key={k} variant="body2">
                      <Box component="span" fontWeight={600}>
                        {k}:{' '}
                      </Box>
                      {String(v)}
                    </Typography>
                  ))}
              </Box>
            ))}
          </Stack>
        </Box>
      ))}
    </>
  );
};

export default MentorshipProfilePage;
