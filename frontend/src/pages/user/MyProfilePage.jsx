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

import UserHighlights from '../../components/profile/UserHighlights';
import PublicUserProfile from './PublicUserProfile';
import StatsBanner from '../../components/StatsBanner';
import AcademicInfoSection from '../../components/profile/AcademicInfoSection';
import PersonalInfoRow from '../../components/profile/PersonalInfoRow';
import ProfileSectionTitle from '../../components/profile/ProfileSectionTitle';
import ExtendedProfileInfoCard from '../../components/profile/ExtendedProfileInfoCard'

import { getMentorProfileTabs, getMenteeProfileTabs } from '../../constants/mentorshipNav';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/dateFormatter';
import { formatRating } from '../../utils/numberFormatter';
import { formatMentorHeadline, resolveProfileRoleLabel } from '../../utils/profileRoleUtils';

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';
const MENTORSHIP_COVER =
  'https://info.cognician.com/hubfs/220201%20mentorship-%20desktop.png';
const ITEMS_PER_PAGE = 3;
const PUBLIC_FEEDBACKS_PER_PAGE = 5;

const normalizeTags = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap(normalizeTags);
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const getCategoryLabel = (t) => ({
  CAREER: t('profile:category_career'),
  ACADEMIC: t('profile:category_academic'),
  SOFT_SKILLS: t('profile:category_soft_skills'),
  GENERAL: t('profile:category_general'),
});

const getSectionLabels = (t) => ({
  educations: t('profile:section_label_educations'),
  experiences: t('profile:section_label_experiences'),
  projects: t('profile:section_label_projects'),
  awards: t('profile:section_label_awards'),
  skills: t('profile:section_label_skills'),
});

const ProfileItem = ({ label, value, icon: Icon, notUpdatedLabel = 'Not updated' }) => (
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
        {value?.trim?.() || value || notUpdatedLabel}
      </Typography>
    </Box>
  </Box>
);

const SECTION_ICONS = {
  educations: SchoolIcon,
  experiences: WorkIcon,
  projects: ArticleIcon,
  awards: EmojiEventsIcon,
  skills: PsychologyIcon,
};

const ExtendedProfileSections = ({ raw, t }) => {
  if (!raw) return null;
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const sectionLabels = getSectionLabels(t);
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
              <Icon /> {sectionLabels[key]}
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

const ExpertiseSection = ({ expertise, t }) => {
  const categoryLabel = getCategoryLabel(t);
  return (
    <Box>
      <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
        <WorkspacePremiumIcon /> {t('profile:expertise_shareable')}
      </Typography>
      {expertise.length === 0 ? (
        <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>{t('profile:no_expertise')}</Typography>
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
                        {categoryLabel[item.category] ?? item.category}
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
};

const ReviewsSection = ({
  feedbacks,
  ratingAvg,
  page,
  totalPages,
  onPageChange,
  t,
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
        <StarIcon sx={{ color: 'warning.main' }} /> {t('profile:reviews_section')}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'background.paper', px: 2, py: 1, borderRadius: 2, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.05)' }}>
        <StarIcon sx={{ color: 'warning.main', fontSize: 24 }} />
        <Typography variant="h6" fontWeight={800} color="text.primary">
          {formatRating(ratingAvg)}
        </Typography>
        <Typography color="text.secondary" fontWeight={500}>{t('profile:reviews_count', { count: feedbacks.length })}</Typography>
      </Box>
    </Box>

    {feedbacks.length === 0 ? (
      <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>{t('profile:no_reviews')}</Typography>
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
              {t('profile:prev_page')}
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
              {t('profile:next_page')}
            </Button>
          </Box>
        )}
      </>
    )}
  </Box>
);

const OwnProfile = ({ navigate, isMentorshipPath }) => {
  const { t } = useTranslation(['mentorship', 'profile']);
  const authUser = useAuthStore((state) => state.user);
  
  const profileQuery = useMyProfile();
  const orgMemberQuery = useMyOrganizationMember();

  const mentorQuery = useMyMentorProfile();
  const access = useMentorshipAccessState();
  const menteeQuery = useMyMenteeProfile({ enabled: access.canUseMentorship });
  const expertiseQuery = useMyExpertise({ enabled: access.hasMentorProfile });
  const feedbacksQuery = useMyMentorFeedbacks(0, 50, { enabled: access.hasMentorProfile });

  const [feedbackPage, setFeedbackPage] = useState(1);

  const profile = profileQuery.data;
  const orgMember = orgMemberQuery.data;
  const mentor = mentorQuery.data;
  const mentee = menteeQuery.data;
  const expertise = useMemo(() => expertiseQuery.data ?? [], [expertiseQuery.data]);
  const feedbacks = useMemo(() => feedbacksQuery.data?.items ?? [], [feedbacksQuery.data]);

  const shouldUseMentorDisplayData = isMentorshipPath;
  // Derived user details
  const coverUrl = mentor?.coverUrl || (shouldUseMentorDisplayData ? MENTORSHIP_COVER : DEFAULT_COVER);
  const currentJobTitle = (shouldUseMentorDisplayData ? mentor?.currentJobTitle : null) || profile?.currentJobTitle || mentor?.currentJobTitle;
  const currentCompany = (shouldUseMentorDisplayData ? mentor?.currentCompany : null) || profile?.currentCompany || mentor?.currentCompany;
  const personalBio = profile?.bio;
  const mentorBio = mentor?.bio;
  const extendedProfile = (shouldUseMentorDisplayData ? mentor?.extendedProfile : null) || profile?.extendedProfile;

  const user = {
    name: profile?.fullName ?? t('profile:my_account'),
    role: shouldUseMentorDisplayData
      ? formatMentorHeadline({ jobTitle: currentJobTitle, company: currentCompany, t })
      : resolveProfileRoleLabel({ profile, academicProfile: orgMember, t }),
    avatar: profile?.avatarUrl ?? '',
    cover: coverUrl,
  };

  const tabs = isMentorshipPath
    ? (access.hasMentorProfile ? getMentorProfileTabs(t) : (access.hasMenteeProfile ? getMenteeProfileTabs(t) : []))
    : [];

  if (profileQuery.isLoading || orgMemberQuery.isLoading || (isMentorshipPath && access.isLoading)) {
    return (
      <Page title={t('profile:page_title_profile')}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <Page title={t('profile:page_title_profile')}>
        <Box sx={{ maxWidth: 720, mx: 'auto', py: 6, px: 2 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {t('profile:error_load_profile', { defaultValue: 'Không thể tải thông tin hồ sơ. Vui lòng thử lại.' })}
          </Alert>
        </Box>
      </Page>
    );
  }

  const renderPersonalSection = () => {
    const personalFields = [
      { icon: PersonIcon, label: t('profile:full_name'), value: profile?.fullName },
      { icon: EmailIcon, label: t('profile:email'), value: profile?.email },
      { icon: WorkIcon, label: t('profile:current_job'), value: currentJobTitle },
      { icon: BusinessIcon, label: t('profile:company'), value: currentCompany },
    ];

    const hasBio = !!personalBio?.trim();

    return (
      <Box>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }} sx={{ pb: 2 }}>
            <ProfileSectionTitle icon={PersonIcon}>{t('profile:intro_section')}</ProfileSectionTitle>
            <Typography
              color={hasBio ? 'text.secondary' : 'text.disabled'}
              sx={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: hasBio ? 'normal' : 'italic' }}
            >
              {personalBio?.trim() || t('profile:no_bio')}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ height: '100%' }}>
              <ProfileSectionTitle icon={BusinessIcon}>{t('profile:basic_info')}</ProfileSectionTitle>
              <Box>
                {personalFields.map((field, index) => (
                  <PersonalInfoRow key={index} icon={field.icon} label={field.label} value={field.value} />
                ))}
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <AcademicInfoSection academicProfile={orgMember} />
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
                {t('profile:no_mentorship_joined')}
              </Typography>
              <Typography variant="body2">
                {t('profile:no_mentorship_desc')}
              </Typography>
            </Alert>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button variant="contained" size="large" sx={{ borderRadius: 2 }} onClick={() => navigate('/development/mentorship/mentee-signup')}>
                {t('profile:find_mentor_btn')}
              </Button>
              <Button variant="outlined" size="large" sx={{ borderRadius: 2 }} onClick={() => navigate('/development/mentorship/signup')}>
                {t('profile:become_mentor_btn')}
              </Button>
            </Stack>
          </Box>
        );
      }
      return null;
    }

    if (access.hasMentorProfile) {
      const mentorTopicFallback = normalizeTags(mentor?.expertiseTopics);
      const expertiseTags = expertise.map((e) => e.tag || e.topic).flatMap(normalizeTags);
      const stats = [
        { value: expertise.length || mentorTopicFallback.length, label: t('profile:stats_expertise') },
        { value: mentor?.totalSessions ?? 0, label: t('profile:stats_sessions') },
        { value: formatRating(mentor?.ratingAvg), label: t('profile:stats_rating') },
        { value: feedbacks.length, label: t('profile:stats_feedbacks') },
      ];
      const tags = Array.from(new Set([...expertiseTags, ...mentorTopicFallback]));
      const hasMentorBio = !!mentorBio?.trim();

      const totalPages = Math.max(1, Math.ceil(feedbacks.length / ITEMS_PER_PAGE));
      const paginatedReviews = feedbacks.slice((feedbackPage - 1) * ITEMS_PER_PAGE, feedbackPage * ITEMS_PER_PAGE);

      return (
        <Stack spacing={5} sx={{ pt: isMentorshipPath ? 0 : 4, borderTop: isMentorshipPath ? 'none' : '1px solid', borderColor: 'divider' }}>
          {!isMentorshipPath && (
            <Typography variant="h4" fontWeight={800} color="primary.main" textAlign="center" mb={1}>
              {t('profile:mentor_profile_heading')}
            </Typography>
          )}
          {mentor.status !== 'APPROVED' && isMentorshipPath && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              {t('profile:mentor_pending_warning')}
            </Alert>
          )}
          <StatsBanner items={stats} />

          {isMentorshipPath && (
            <Box>
              <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
                <PersonIcon /> {t('profile:intro_section')}
              </Typography>
              <Typography
                color={hasMentorBio ? 'text.secondary' : 'text.disabled'}
                sx={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: hasMentorBio ? 'normal' : 'italic' }}
              >
                {mentorBio?.trim() || t('profile:no_intro')}
              </Typography>
            </Box>
          )}

          <ExpertiseSection expertise={expertise} t={t} />

          {tags.length > 0 && (
            <Box>
              <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
                <VerifiedIcon /> {t('profile:skills_section')}
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
            t={t}
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
              {t('profile:mentee_profile_heading')}
            </Typography>
          )}
          <Box>
            <Typography variant="h5" fontWeight={800} color="primary.main" mb={2} display="flex" alignItems="center" gap={1}>
              <PersonIcon /> {t('profile:mentee_goal_section')}
            </Typography>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography color={mentee?.mentoringGoal?.trim() ? 'text.secondary' : 'text.disabled'} sx={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: mentee?.mentoringGoal?.trim() ? 'normal' : 'italic' }}>
                  {mentee?.mentoringGoal?.trim() || t('profile:no_mentee_goal')}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          {interestTags.length > 0 && (
            <Box>
              <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
                <VerifiedIcon /> {t('profile:interest_section')}
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
    <Page title={t('profile:page_title_profile')}>
      <ProfileLayout
        user={user}
        cover={user.cover}
        tabs={tabs}
        onNavigate={navigate}
        mode={isMentorshipPath ? 'mentor' : 'user'}
        contentSx={isMentorshipPath ? { pb: { xs: 4, md: 8 } } : undefined}
      >
        <Stack spacing={6}>
          {isMentorshipPath ? (
            <>
              {renderMentorshipSection()}
              <Box sx={{ pt: 6, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h4" fontWeight={800} color="primary.main" mb={5} textAlign="center" textTransform="uppercase">
                  {t('profile:general_info')}
                </Typography>
                {renderPersonalSection()}
                <Box mt={6}>
                  <ExtendedProfileSections raw={extendedProfile} t={t} />
                </Box>
              </Box>
            </>
          ) : (
            <>
              {renderPersonalSection()}
              <Box mt={2}>
                <ExtendedProfileSections raw={extendedProfile} t={t} />
              </Box>
              <UserHighlights userId={profile?.userId || authUser?.id} navigate={navigate} />
            </>
          )}
        </Stack>
      </ProfileLayout>
    </Page>
  );
};


const PublicMentorProfile = ({ mentorMemberId, navigate }) => {
  const { t } = useTranslation(['mentorship', 'profile']);
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
      <Alert severity="error">{t('profile:error_load_mentor')}</Alert>
    );
  }

  const user = {
    name: mentor.fullName ?? `Mentor #${mentor.memberId}`,
    role: formatMentorHeadline({ jobTitle: mentor.currentJobTitle, company: mentor.currentCompany, t }),
    avatar: mentor.avatarUrl ?? '',
    cover: mentor.coverUrl || MENTORSHIP_COVER,
  };

  const stats = [
    { value: expertise.length || (mentor.expertiseTopics?.length ?? 0), label: t('profile:stats_expertise') },
    { value: mentor.totalSessions ?? 0, label: t('profile:stats_sessions') },
    { value: formatRating(mentor.ratingAvg), label: t('profile:stats_rating') },
  ];

  const tags = Array.from(new Set([
    ...expertise.map((e) => e.tag || e.topic).flatMap(normalizeTags),
    ...normalizeTags(mentor.expertiseTopics),
  ]));

  return (
    <ProfileLayout
      user={user}
      cover={user.cover}
      tabs={[]}
      onNavigate={navigate}
      mode="mentee"
      mentorId={mentorMemberId}
      canBook={canBook}
      contentSx={{ pb: { xs: 4, md: 8 } }}
    >
      <Stack spacing={5}>
        {access.needsOrgVerification && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {t('profile:preview_mode_warning')}
          </Alert>
        )}

        <Typography variant="h3" fontWeight={800} color="primary.main" textAlign="center">
          {t('profile:mentor_public_heading')}
        </Typography>

        <StatsBanner items={stats} />
      </Stack>

      <Box sx={{ mt: 5 }}>
        <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
          <PersonIcon /> {t('profile:intro_section')}
        </Typography>
        <Typography color={mentor.bio?.trim() ? 'text.secondary' : 'text.disabled'} sx={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: mentor.bio?.trim() ? 'normal' : 'italic' }}>
          {mentor.bio?.trim() || t('profile:no_intro')}
        </Typography>
      </Box>

      <Box sx={{ mt: 5 }}>
        <ExpertiseSection expertise={expertise} t={t} />
      </Box>

      {tags.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
            <VerifiedIcon /> {t('profile:skills_section')}
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
            t={t}
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
