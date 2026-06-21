import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ArticleIcon from '@mui/icons-material/Article';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';

import Page from '../../components/Page';
import ProfileLayout from '../../layouts/ProfileLayout';
import MentorshipBrowseGate from '../../components/mentorship/MentorshipBrowseGate';
import MentorshipTag from '../../components/mentorship/MentorshipTag';
import MentorshipReviewCard from '../../components/mentorship/MentorshipReviewCard';

import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyProfile } from '../../hooks/profile/useMyProfile';
import { useMyOrganizationMember } from '../../hooks/useMyOrganizationMember';
import useAuthStore from '../../stores/authStore';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyMenteeProfile } from '../../hooks/mentorship/useMyMenteeProfile';
import { useMyExpertise } from '../../hooks/mentorship/useMyExpertise';
import { useMyMentorFeedbacks } from '../../hooks/mentorship/useMyMentorFeedbacks';
import { useMentorPublicProfile } from '../../hooks/mentorship/useMentorPublicProfile';
import { useMentorPublicFeedbacks } from '../../hooks/mentorship/useMentorPublicFeedbacks';
import { useMentorExpertise } from '../../hooks/mentorship/useMentorExpertise';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { usePublicProfile } from '../../hooks/profile/usePublicProfile';
import { useUserAlumniPosts } from '../../hooks/articles/useUserAlumniPosts';
import { useUserDonations } from '../../hooks/fundraising/useUserDonations';

import UserHighlights from '../../components/profile/UserHighlights';
import PublicUserProfile from './PublicUserProfile';
import StatsBanner from '../../components/StatsBanner';
import AcademicInfoRowCard from '../../components/profile/AcademicInfoRowCard';
import PersonalInfoRow from '../../components/profile/PersonalInfoRow';
import ExtendedProfileInfoCard from '../../components/profile/ExtendedProfileInfoCard'

import { MENTOR_PROFILE_TABS, MENTEE_PROFILE_TABS } from '../../constants/mentorshipNav';
import { formatDate } from '../../utils/dateFormatter';
import { formatRating } from '../../utils/numberFormatter';

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

const ProfileItem = ({ label, value, icon: Icon }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      p: 2.5,
      bgcolor: 'background.paper',
      borderRadius: 3,
      boxShadow: '0 2px 12px 0 rgba(0,0,0,0.03)',
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px 0 rgba(0,0,0,0.08)',
        borderColor: 'primary.light',
      },
      height: '100%',
    }}
  >
    {Icon && (
      <Box
        sx={{
          display: 'flex',
          p: 1.5,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          color: 'primary.main',
          mr: 2,
        }}
      >
        <Icon fontSize="small" />
      </Box>
    )}
    <Box sx={{ flex: 1 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} color="text.primary" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
        {value?.trim?.() || value || 'Chưa cập nhật'}
      </Typography>
    </Box>
  </Box>
);

const formatAcademicValue = (raw) => {
  if (raw == null) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch {
    // fallthrough
  }
  if (Array.isArray(raw)) return raw.join(', ');
  return String(raw);
};

const SECTION_ICONS = {
  educations: SchoolIcon,
  experiences: WorkIcon,
  projects: ArticleIcon,
  awards: EmojiEventsIcon,
  skills: PsychologyIcon,
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
    <Stack spacing={5}>
      {sections.map(({ key, items }) => {
        const Icon = SECTION_ICONS[key] || ArticleIcon;
        const GRID_SIZE = { educations: 4, awards: 4, skills: 4, experiences: 12, projects: 12, };
        return (
          <Box key={key}>
            <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
              <Icon /> {SECTION_LABELS[key]}
            </Typography>
            <Grid container spacing={3}>
              {items.map((item, idx) => (
                <Grid item xs={12} md={GRID_SIZE[key] ?? 6} key={idx}>
                  <ExtendedProfileInfoCard item={item} icon={Icon} />
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}
    </Stack>
  );
};

const ExpertiseSection = ({ expertise }) => (
  <Box>
    <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
      <WorkspacePremiumIcon /> Nội dung có thể chia sẻ
    </Typography>
    {expertise.length === 0 ? (
      <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>Chưa có nội dung nào.</Typography>
    ) : (
      <Grid container spacing={2.5}>
        {expertise.map((item) => (
          <Grid item xs={12} md={6} key={item.id ?? item.topic}>
            <Box
              sx={{
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.03)',
                height: '100%',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px 0 rgba(0,0,0,0.08)',
                  borderColor: 'primary.light',
                }
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  {item.topic}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {item.category && (
                    <Box sx={{ px: 1.5, py: 0.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}>
                      {CATEGORY_LABEL[item.category] ?? item.category}
                    </Box>
                  )}
                  {item.tag && (
                    <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'action.hover', color: 'text.secondary', borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}>
                      #{item.tag}
                    </Box>
                  )}
                </Box>

                {item.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'pre-line', mt: 1, lineHeight: 1.6 }}
                  >
                    {item.description}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>
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
        mb: 3,
      }}
    >
      <Typography variant="h5" fontWeight={800} color="primary.main" display="flex" alignItems="center" gap={1}>
        <StarIcon sx={{ color: 'warning.main' }} /> Đánh giá
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'background.paper', px: 2, py: 1, borderRadius: 2, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.05)' }}>
        <StarIcon sx={{ color: 'warning.main', fontSize: 24 }} />
        <Typography variant="h6" fontWeight={800} color="text.primary">
          {formatRating(ratingAvg)}
        </Typography>
        <Typography color="text.secondary" fontWeight={500}>({feedbacks.length} đánh giá)</Typography>
      </Box>
    </Box>

    {feedbacks.length === 0 ? (
      <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>Chưa có đánh giá nào.</Typography>
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
            <Button variant="outlined" disabled={page <= 1} onClick={() => onPageChange(page - 1)} sx={{ borderRadius: 2 }}>
              Trước
            </Button>
            <Typography sx={{ display: 'flex', alignItems: 'center', px: 2, fontWeight: 600 }}>
              {page} / {totalPages}
            </Typography>
            <Button
              variant="outlined"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              sx={{ borderRadius: 2 }}
            >
              Sau
            </Button>
          </Box>
        )}
      </>
    )}
  </Box>
);

const OwnProfile = ({ navigate, isMentorshipPath }) => {
  const authUser = useAuthStore((state) => state.user);
  
  const profileQuery = useMyProfile();
  const orgMemberQuery = useMyOrganizationMember();

  const mentorQuery = useMyMentorProfile();
  const menteeQuery = useMyMenteeProfile();
  const expertiseQuery = useMyExpertise();
  const feedbacksQuery = useMyMentorFeedbacks(0, 50);

  const [feedbackPage, setFeedbackPage] = useState(1);

  const profile = profileQuery.data;
  const orgMember = orgMemberQuery.data;
  const mentor = mentorQuery.data;
  const mentee = menteeQuery.data;
  const expertise = useMemo(() => expertiseQuery.data ?? [], [expertiseQuery.data]);
  const feedbacks = useMemo(() => feedbacksQuery.data?.items ?? [], [feedbacksQuery.data]);

  const access = useMentorshipAccessState();
  // Derived user details
  const coverUrl = mentor?.coverUrl || profile?.coverUrl || DEFAULT_COVER;
  const currentJobTitle = mentor?.currentJobTitle || profile?.currentJobTitle;
  const currentCompany = mentor?.currentCompany || profile?.currentCompany;
  const bio = mentor?.bio || profile?.bio;
  const extendedProfile = mentor?.extendedProfile || profile?.extendedProfile;

  const user = {
    name: profile?.fullName ?? 'Tài khoản của tôi',
    role: [currentJobTitle, currentCompany].filter(Boolean).join(' @ ') || 'Thành viên',
    avatar: profile?.avatarUrl ?? '',
    cover: coverUrl,
  };

  const tabs = isMentorshipPath
    ? (access.hasMentorProfile ? MENTOR_PROFILE_TABS : (access.hasMenteeProfile ? MENTEE_PROFILE_TABS : []))
    : [];

  const renderPersonalSection = () => {
    // Cấu hình mảng dữ liệu cho Thông tin cơ bản
    const personalFields = [
      { icon: Person, label: 'Họ và tên', value: profile?.fullName },
      { icon: Email, label: 'Email', value: profile?.email },
      { icon: Work, label: 'Công việc hiện tại', value: currentJobTitle },
      { icon: Business, label: 'Công ty', value: currentCompany },
    ];

    // Cấu hình mảng dữ liệu cho Thông tin học thuật
    const academicFields = [
      { label: 'Khoa', value: formatAcademicValue(orgMember?.faculty), icon: AccountBalanceIcon },
      { label: 'Chuyên ngành', value: formatAcademicValue(orgMember?.major), icon: AccountTreeIcon },
      { label: 'Chương trình', value: formatAcademicValue(orgMember?.program), icon: MenuBookIcon },
      { label: 'Khoá', value: formatAcademicValue(orgMember?.startedYear), icon: CalendarMonthIcon },
      { label: 'Năm tốt nghiệp', value: formatAcademicValue(orgMember?.graduatedYear), icon: EventAvailableIcon },
      { label: 'Trạng thái tốt nghiệp', value: formatAcademicValue(orgMember?.graduationStatus), icon: VerifiedIcon },
    ];

    // Component tiêu đề dùng chung để giảm lặp code UI
    const SectionTitle = ({ icon:  children }) => (
      <Typography variant="h5" fontWeight={800} color="primary.main" mb={2} display="flex" alignItems="center" gap={1}>
        <Icon /> {children}
      </Typography>
    );

    const hasBio = !!bio?.trim();

    return (
      <Box>
        <Grid container spacing={4}>
          {/* Giới thiệu */}
          <Grid size={{ xs: 12 }} sx={{ pb: 2 }}>
            <SectionTitle icon={PersonIcon}>Giới thiệu</SectionTitle>
            <Typography 
              color={hasBio ? 'text.secondary' : 'text.disabled'} 
              sx={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: hasBio ? 'normal' : 'italic' }}
            >
              {bio?.trim() || 'Bạn chưa cập nhật phần giới thiệu.'}
            </Typography>
          </Grid>

          {/* Thông tin cơ bản */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ height: '100%' }}>
              <SectionTitle icon={BusinessIcon}>Thông tin cơ bản</SectionTitle>
              <Box>
                {personalFields.map((field, index) => (
                  <PersonalInfoRow key={index} icon={field.icon} label={field.label} value={field.value} />
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Thông tin học thuật */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <SectionTitle icon={SchoolIcon}>Thông tin học thuật</SectionTitle>
            <Grid container spacing={3} sx={{ py: 1.75 }}>
              {academicFields.map((field, index) => (
                <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                  <AcademicInfoRowCard icon={field.icon} label={field.label} value={field.value} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderMentorshipSection = () => {
    if (!access.hasMentorProfile && !access.hasMenteeProfile) {
      if (isMentorshipPath) {
        return (
          <Box sx={{ maxWidth: 720, mx: 'auto', py: 6, px: 2 }}>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
              <Typography fontWeight={700} mb={0.5}>
                Bạn chưa tham gia chương trình cố vấn
              </Typography>
              <Typography variant="body2">
                Tạo hồ sơ để tìm cố vấn phù hợp, hoặc đăng ký trở thành cố vấn để chia sẻ kinh nghiệm với cộng đồng.
              </Typography>
            </Alert>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button variant="contained" size="large" sx={{ borderRadius: 2 }} onClick={() => navigate('/development/mentorship/mentee-signup')}>
                Tìm cố vấn cho tôi
              </Button>
              <Button variant="outlined" size="large" sx={{ borderRadius: 2 }} onClick={() => navigate('/development/mentorship/signup')}>
                Trở thành cố vấn
              </Button>
            </Stack>
          </Box>
        );
      }
      return null;
    }

    if (access.hasMentorProfile) {
      const stats = [
        { value: expertise.length, label: 'lĩnh vực chia sẻ' },
        { value: mentor?.totalSessions ?? 0, label: 'buổi đã hoàn thành' },
        { value: formatRating(mentor?.ratingAvg), label: 'đánh giá trung bình' },
        { value: feedbacks.length, label: 'phản hồi' },
      ];
      const tags = expertise.map((e) => e.tag || e.topic).filter(Boolean);
      
      const totalPages = Math.max(1, Math.ceil(feedbacks.length / ITEMS_PER_PAGE));
      const paginatedReviews = feedbacks.slice((feedbackPage - 1) * ITEMS_PER_PAGE, feedbackPage * ITEMS_PER_PAGE);

      return (
        <Stack spacing={5} sx={{ pt: isMentorshipPath ? 0 : 4, borderTop: isMentorshipPath ? 'none' : '1px solid', borderColor: 'divider' }}>
          {!isMentorshipPath && (
            <Typography variant="h4" fontWeight={800} color="primary.main" textAlign="center" mb={1}>
              HỒ SƠ CỐ VẤN CỦA TÔI
            </Typography>
          )}
          {mentor.status !== 'APPROVED' && isMentorshipPath && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Hồ sơ cố vấn của bạn đang chờ khoa duyệt. Trong thời gian này bạn chưa xuất hiện trong
              danh sách tìm cố vấn.
            </Alert>
          )}
          <StatsBanner items={stats} />
          
          <ExpertiseSection expertise={expertise} />
          
          {tags.length > 0 && (
            <Box>
              <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
                <VerifiedIcon /> Kỹ năng
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
            ratingAvg={mentor.ratingAvg}
            page={feedbackPage}
            totalPages={totalPages}
            onPageChange={setFeedbackPage}
          />
        </Stack>
      );
    }

    if (access.hasMenteeProfile) {
      const interestTags = (mentee?.interests ?? '').split(',').map((s) => s.trim()).filter(Boolean);
      return (
        <Stack spacing={5} sx={{ pt: isMentorshipPath ? 0 : 4, borderTop: isMentorshipPath ? 'none' : '1px solid', borderColor: 'divider' }}>
          {!isMentorshipPath && (
            <Typography variant="h4" fontWeight={800} color="primary.main" textAlign="center" mb={1}>
              HỒ SƠ MENTEE CỦA TÔI
            </Typography>
          )}
          <Box>
            <Typography variant="h5" fontWeight={800} color="primary.main" mb={2} display="flex" alignItems="center" gap={1}>
              <PersonIcon /> Mục tiêu của tôi
            </Typography>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography color={mentee?.mentoringGoal?.trim() ? 'text.secondary' : 'text.disabled'} sx={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: mentee?.mentoringGoal?.trim() ? 'normal' : 'italic' }}>
                  {mentee?.mentoringGoal?.trim() || 'Bạn chưa chia sẻ mục tiêu mong muốn được hỗ trợ.'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          {interestTags.length > 0 && (
            <Box>
              <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
                <VerifiedIcon /> Lĩnh vực quan tâm
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {interestTags.map((tag, idx) => (
                  <MentorshipTag key={idx} label={tag} />
                ))}
              </Box>
            </Box>
          )}
        </Stack>
      );
    }
  };

  return (
    <Page title="Trang cá nhân">
      <ProfileLayout
        user={user}
        cover={user.cover}
        tabs={tabs}
        onNavigate={navigate}
        mode="user"
      >
        <Stack spacing={6}>
          {isMentorshipPath ? (
            <>
              {renderMentorshipSection()}
              <Box sx={{ pt: 6, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h4" fontWeight={800} color="primary.main" mb={5} textAlign="center" textTransform="uppercase">
                  Thông tin chung
                </Typography>
                {renderPersonalSection()}
                <Box mt={6}>
                  <ExtendedProfileSections raw={extendedProfile} />
                </Box>
              </Box>
            </>
          ) : (
            <>
              {renderPersonalSection()}
              <Box mt={2}>
                <ExtendedProfileSections raw={extendedProfile} />
              </Box>
              <UserHighlights userId={profile?.userId || authUser?.id} navigate={navigate} />
              {renderMentorshipSection()}
            </>
          )}
        </Stack>
      </ProfileLayout>
    </Page>
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
  const canBook = access.canUseMentorship && access.hasJoinedMentorship && !isOwnProfile;

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
    role: [mentor.currentJobTitle, mentor.currentCompany].filter(Boolean).join(' @ ') || 'Cố vấn',
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
    <ProfileLayout
      user={user}
      cover={user.cover}
      tabs={[]}
      onNavigate={navigate}
      mode="mentee"
      mentorId={mentorMemberId}
      canBook={canBook}
    >
      <Stack spacing={5}>
        {access.needsOrgVerification && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Bạn đang xem hồ sơ ở chế độ xem trước. Xác minh học vấn tại khoa để đặt lịch và xem đánh
            giá đầy đủ.
          </Alert>
        )}

        <Typography variant="h3" fontWeight={800} color="primary.main" textAlign="center">
          HỒ SƠ CỐ VẤN
        </Typography>

        <StatsBanner items={stats} />
      </Stack>

      <Box sx={{ mt: 5 }}>
        <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
          <PersonIcon /> Giới thiệu
        </Typography>
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography color={mentor.bio?.trim() ? 'text.secondary' : 'text.disabled'} sx={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: mentor.bio?.trim() ? 'normal' : 'italic' }}>
              {mentor.bio?.trim() || 'Chưa có phần giới thiệu.'}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 5 }}>
        <ExpertiseSection expertise={expertise} />
      </Box>

      {tags.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
            <VerifiedIcon /> Kỹ năng
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tags.map((tag, idx) => (
              <MentorshipTag key={idx} label={tag} />
            ))}
          </Box>
        </Box>
      )}

      {access.canUseMentorship && (
        <Box sx={{ mt: 5 }}>
          <ReviewsSection
            feedbacks={feedbacks}
            ratingAvg={mentor.ratingAvg}
            page={(feedbackPageData?.currentPage ?? 0) + 1}
            totalPages={feedbackPageData?.totalPage ?? 1}
            onPageChange={(p) => setFeedbackPage(p - 1)}
          />
        </Box>
      )}
    </ProfileLayout>
  );
};

const UnifiedProfilePage = () => {
  const navigate = useOrgNavigate();
  const location = useLocation();
  const { mentorId, id } = useParams();

  const isPublicView = mentorId != null || id != null;
  const targetUserId = isPublicView ? Number(mentorId || id) : null;
  const isMentorshipPath = location.pathname.includes('/mentorship');

  if (isMentorshipPath && mentorId != null) {
    return <PublicMentorProfile mentorMemberId={targetUserId} navigate={navigate} />;
  }

  if (isPublicView) {
    return <PublicUserProfile userId={targetUserId} navigate={navigate} />;
  }

  return <OwnProfile navigate={navigate} isMentorshipPath={isMentorshipPath} />;
};

export default UnifiedProfilePage;
