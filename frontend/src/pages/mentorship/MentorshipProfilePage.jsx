import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
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
import MentorshipProfileLayout from '../../layouts/ProfileLayout';
import MentorshipBrowseGate from '../../components/mentorship/MentorshipBrowseGate';
import MentorshipTag from '../../components/mentorship/MentorshipTag';
import MentorshipReviewCard from '../../components/mentorship/MentorshipReviewCard';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyProfile } from '../../hooks/profile/useMyProfile';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyMenteeProfile } from '../../hooks/mentorship/useMyMenteeProfile';
import { useMyExpertise } from '../../hooks/mentorship/useMyExpertise';
import { useMyMentorFeedbacks } from '../../hooks/mentorship/useMyMentorFeedbacks';
import { useMentorPublicProfile } from '../../hooks/mentorship/useMentorPublicProfile';
import { useMentorPublicFeedbacks } from '../../hooks/mentorship/useMentorPublicFeedbacks';
import { useMentorExpertise } from '../../hooks/mentorship/useMentorExpertise';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { MENTOR_PROFILE_TABS, MENTEE_PROFILE_TABS } from '../../constants/mentorshipNav';
import { formatDate } from '../../utils/dateFormatter';
import { formatRating } from '../../utils/numberFormatter';

const TOP_TABS = MENTOR_PROFILE_TABS;

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

const ITEMS_PER_PAGE = 3;
const PUBLIC_FEEDBACKS_PER_PAGE = 5;

const CATEGORY_LABEL = {
  CAREER: 'Định hướng nghề nghiệp',
  ACADEMIC: 'Học tập / Học bổng',
  SOFT_SKILLS: 'Kỹ năng mềm',
  GENERAL: 'Chung',
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

const StatsGrid = ({ stats }) => (
  <Box
    sx={{
      backgroundColor: 'primary.main',
      borderRadius: 2,
      px: { xs: 3, md: 6 },
      py: { xs: 3, md: 4 },
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        sm: stats.length <= 3 ? `repeat(${stats.length}, 1fr)` : '1fr 1fr',
        md: `repeat(${Math.min(stats.length, 4)}, 1fr)`,
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
);

const ExpertiseSection = ({ expertise }) => (
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
            key={item.id ?? item.topic}
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
);

const ReviewsSection = ({
  feedbacks,
  ratingAvg,
  page,
  totalPages,
  onPageChange,
}) => (
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
          {formatRating(ratingAvg)}
        </Typography>
        <Typography color="text.secondary">({feedbacks.length} đánh giá)</Typography>
      </Box>
    </Box>

    {feedbacks.length === 0 ? (
      <Typography color="text.secondary">Chưa có đánh giá nào.</Typography>
    ) : (
      <>
        <Stack spacing={3}>
          {feedbacks.map((review) => (
            <MentorshipReviewCard
              key={review.id}
              name={review.menteeName ?? 'Mentee'}
              date={formatDate(review.createdAt, '')}
              avatar={review.menteeAvatarUrl ?? ''}
              rating={review.rating}
              content={review.comment ?? ''}
            />
          ))}
        </Stack>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 4 }}>
            <Button variant="outlined" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Trước
            </Button>
            <Typography sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
              {page} / {totalPages}
            </Typography>
            <Button
              variant="outlined"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Sau
            </Button>
          </Box>
        )}
      </>
    )}
  </Box>
);

const OwnMentorProfile = ({ navigate }) => {
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
      { value: profile?.totalSessions ?? 0, label: 'buổi đã hoàn thành' },
      { value: formatRating(profile?.ratingAvg), label: 'đánh giá trung bình' },
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

  if (profileQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const user = {
    name: profile.fullName ?? `Mentor #${profile.memberId}`,
    role:
      [profile.currentJobTitle, profile.currentCompany].filter(Boolean).join(' @ ') || 'Cố vấn',
    avatar: profile.avatarUrl ?? '',
    cover: DEFAULT_COVER,
  };

  return (
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

        {profile.status !== 'APPROVED' && (
          <Alert severity="warning">
            Hồ sơ cố vấn của bạn đang chờ khoa duyệt. Trong thời gian này bạn chưa xuất hiện trong
            danh sách tìm cố vấn.
          </Alert>
        )}

        <StatsGrid stats={stats} />
      </Stack>

      <Box>
        <Typography variant="h4" fontWeight={700} color="primary.main" mb={1}>
          Giới thiệu
        </Typography>
        <Typography color="text.primary" sx={{ whiteSpace: 'pre-line' }}>
          {profile.bio?.trim() || 'Bạn chưa cập nhật phần giới thiệu.'}
        </Typography>
      </Box>

      <ExtendedProfileSections raw={profile.extendedProfile} />
      <ExpertiseSection expertise={expertise} />

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

      <ReviewsSection
        feedbacks={paginatedReviews}
        ratingAvg={profile.ratingAvg}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </MentorshipProfileLayout>
  );
};

const PublicMentorProfile = ({ mentorMemberId, navigate }) => {
  const access = useMentorshipAccessState();
  const [feedbackPage, setFeedbackPage] = useState(0);

  const profileQuery = useMentorPublicProfile(mentorMemberId, {
    enabled: access.canPreviewMentors,
  });
  const expertiseQuery = useMentorExpertise(mentorMemberId, {
    enabled: access.canPreviewMentors,
  });
  const feedbacksQuery = useMentorPublicFeedbacks(
    mentorMemberId,
    feedbackPage,
    PUBLIC_FEEDBACKS_PER_PAGE,
    { enabled: access.canUseMentorship },
  );

  const mentor = profileQuery.data;
  const expertise = useMemo(() => expertiseQuery.data ?? [], [expertiseQuery.data]);
  const feedbackPageData = feedbacksQuery.data;
  const feedbacks = feedbackPageData?.items ?? [];

  const isOwnProfile =
    access.mentorMemberId != null && mentor?.memberId === access.mentorMemberId;
  const canBook = access.canUseMentorship && !isOwnProfile;

  useEffect(() => {
    if (isOwnProfile) {
      navigate('/development/mentorship/profile', { replace: true });
    }
  }, [isOwnProfile, navigate]);

  if (isOwnProfile) {
    return null;
  }

  if (profileQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (profileQuery.isError || !mentor) {
    return (
      <Alert severity="error">Không tải được hồ sơ cố vấn. Vui lòng thử lại.</Alert>
    );
  }

  const user = {
    name: mentor.fullName ?? `Mentor #${mentor.memberId}`,
    role:
      [mentor.currentJobTitle, mentor.currentCompany].filter(Boolean).join(' @ ') || 'Cố vấn',
    avatar: mentor.avatarUrl ?? '',
    cover: DEFAULT_COVER,
  };

  const stats = [
    { value: expertise.length || (mentor.expertiseTopics?.length ?? 0), label: 'lĩnh vực chia sẻ' },
    { value: mentor.totalSessions ?? 0, label: 'buổi đã hoàn thành' },
    { value: formatRating(mentor.ratingAvg), label: 'đánh giá trung bình' },
  ];

  const tags =
    expertise.length > 0
      ? expertise.map((e) => e.tag || e.topic).filter(Boolean)
      : (mentor.expertiseTopics ?? []);

  return (
    <MentorshipProfileLayout
      user={user}
      cover={user.cover}
      tabs={[]}
      onNavigate={navigate}
      mode="mentee"
      mentorId={mentorMemberId}
      canBook={canBook}
    >
      <Stack spacing={4}>
        {access.needsOrgVerification && (
          <Alert severity="info">
            Bạn đang xem hồ sơ ở chế độ xem trước. Xác minh học vấn tại khoa để đặt lịch và xem đánh
            giá đầy đủ.
          </Alert>
        )}

        <Typography variant="h2" fontWeight={800} color="primary.main">
          HỒ SƠ CỐ VẤN
        </Typography>

        <StatsGrid stats={stats} />
      </Stack>

      <Box>
        <Typography variant="h4" fontWeight={700} color="primary.main" mb={1}>
          Giới thiệu
        </Typography>
        <Typography color="text.primary" sx={{ whiteSpace: 'pre-line' }}>
          {mentor.bio?.trim() || 'Chưa có phần giới thiệu.'}
        </Typography>
      </Box>

      <ExpertiseSection expertise={expertise} />

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

      {access.canUseMentorship && (
        <ReviewsSection
          feedbacks={feedbacks}
          ratingAvg={mentor.ratingAvg}
          page={(feedbackPageData?.currentPage ?? 0) + 1}
          totalPages={feedbackPageData?.totalPage ?? 1}
          onPageChange={(p) => setFeedbackPage(p - 1)}
        />
      )}
    </MentorshipProfileLayout>
  );
};

const OwnMenteeProfile = ({ navigate }) => {
  const menteeQuery = useMyMenteeProfile();
  const displayQuery = useMyProfile();
  const mentee = menteeQuery.data;
  const display = displayQuery.data;

  if (menteeQuery.isLoading || displayQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const user = {
    name: display?.fullName ?? 'Hồ sơ của tôi',
    role: 'Người tìm cố vấn',
    avatar: display?.avatarUrl ?? '',
    cover: display?.coverUrl ?? DEFAULT_COVER,
  };

  const interestTags = (mentee?.interests ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const infoRows = [
    { label: 'Ngành học', value: mentee?.major },
    { label: 'Năm học', value: mentee?.academicYear },
  ].filter((r) => r.value);

  return (
    <MentorshipProfileLayout
      user={user}
      cover={user.cover}
      tabs={MENTEE_PROFILE_TABS}
      onNavigate={navigate}
      mode="menteeOwn"
    >
      <Stack spacing={4}>
        <Typography variant="h2" fontWeight={800} color="primary.main">
          TRANG CÁ NHÂN
        </Typography>

        <Box>
          <Typography variant="h4" fontWeight={700} color="primary.main" mb={1}>
            Mục tiêu của tôi
          </Typography>
          <Typography color="text.primary" sx={{ whiteSpace: 'pre-line' }}>
            {mentee?.mentoringGoal?.trim() || 'Bạn chưa chia sẻ mục tiêu mong muốn được hỗ trợ.'}
          </Typography>
        </Box>

        {infoRows.length > 0 && (
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" mb={1.5}>
              Thông tin học tập
            </Typography>
            <Stack spacing={0.75}>
              {infoRows.map((row) => (
                <Typography key={row.label} variant="body2">
                  <Box component="span" fontWeight={600}>
                    {row.label}:{' '}
                  </Box>
                  {row.value}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        {interestTags.length > 0 && (
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
              Lĩnh vực quan tâm
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {interestTags.map((tag, idx) => (
                <MentorshipTag key={idx} label={tag} />
              ))}
            </Box>
          </Box>
        )}

        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'primary.light',
            bgcolor: (theme) => `${theme.palette.primary.main}0a`,
          }}
        >
          <Typography fontWeight={700} mb={0.5}>
            Sẵn sàng tìm cố vấn?
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Khám phá danh sách cố vấn theo lĩnh vực và đặt lịch trao đổi phù hợp với bạn.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/development/mentorship')}>
            Tìm cố vấn
          </Button>
        </Box>
      </Stack>
    </MentorshipProfileLayout>
  );
};

const OwnProfileRouter = ({ navigate }) => {
  const access = useMentorshipAccessState();

  if (access.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (access.hasMentorProfile) {
    return <OwnMentorProfile navigate={navigate} />;
  }

  if (access.hasMenteeProfile) {
    return <OwnMenteeProfile navigate={navigate} />;
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', py: 6, px: 2 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography fontWeight={700} mb={0.5}>
          Bạn chưa tham gia chương trình cố vấn
        </Typography>
        <Typography variant="body2">
          Tạo hồ sơ để tìm cố vấn phù hợp, hoặc đăng ký trở thành cố vấn để chia sẻ kinh nghiệm với
          cộng đồng.
        </Typography>
      </Alert>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button variant="contained" onClick={() => navigate('/development/mentorship/mentee-signup')}>
          Tìm cố vấn cho tôi
        </Button>
        <Button variant="outlined" onClick={() => navigate('/development/mentorship/signup')}>
          Trở thành cố vấn
        </Button>
      </Stack>
    </Box>
  );
};

const MentorshipProfilePage = () => {
  const navigate = useOrgNavigate();
  const { mentorId } = useParams();
  const isPublicView = mentorId != null;
  const mentorMemberId = isPublicView ? Number(mentorId) : null;

  if (isPublicView) {
    return (
      <MentorshipBrowseGate>
        <Page title="Hồ sơ cố vấn">
          <PublicMentorProfile mentorMemberId={mentorMemberId} navigate={navigate} />
        </Page>
      </MentorshipBrowseGate>
    );
  }

  return (
    <Page title="Trang cá nhân Cố vấn">
      <OwnProfileRouter navigate={navigate} />
    </Page>
  );
};

export default MentorshipProfilePage;
