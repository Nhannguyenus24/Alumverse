import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import {
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useSnackbar } from 'notistack';
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
import { useOrganization } from '../../hooks/useOrganization';
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
import SocialLinksRenderer from '../../components/profile/SocialLinksRenderer';

import {
  getMenteeProfileTabs,
  getMentorProfileTabs,
  getMentorshipProfileOnlyTabs,
} from '../../constants/mentorshipNav';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/dateFormatter';
import { formatRating } from '../../utils/numberFormatter';
import { resolveProfileRoleLabel } from '../../utils/profileRoleUtils';
import { resolveMediaUrl } from '../../utils/imageUtils';
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

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

const getSectionLabels = (t) => ({
  educations: t('profile:section_label_educations'),
  experiences: t('profile:section_label_experiences'),
  projects: t('profile:section_label_projects'),
  awards: t('profile:section_label_awards'),
  skills: t('profile:section_label_skills'),
});

const SECTION_ICONS = {
  educations: SchoolIcon,
  experiences: WorkIcon,
  projects: ArticleIcon,
  awards: EmojiEventsIcon,
  skills: PsychologyIcon,
};

const parseExtendedProfile = (raw) => {
  if (!raw) return {};
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const getItemTitle = (item, key) =>
  item.title || item.name || item.school || item.company || item.degree || item.topic || item.role ||
  (key === 'skills' ? item.name : '');

const getItemSubtitle = (item) =>
  [item.company, item.degree, item.issuer, item.category].filter(Boolean).join(' · ');

const getItemPeriod = (item) =>
  item.period || [item.from || item.startedYear, item.to || item.graduatedYear].filter(Boolean).join(' - ');

const ProfileTimelineSection = ({ title, icon, items = [], t }) => {
  const rows = items.filter((item) => item && typeof item === 'object');
  if (rows.length === 0) return null;
  const TimelineIcon = icon;

  return (
    <ScrollRevealGroup stagger={0.07}>
      <ScrollRevealItem><Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
        <TimelineIcon /> {title}
      </Typography></ScrollRevealItem>
      <Stack spacing={0}>
        {rows.map((item, index) => {
          const titleText = getItemTitle(item);
          const subtitle = getItemSubtitle(item);
          const period = getItemPeriod(item);
          const description = item.description || item.link || '';
          return (
            <ScrollRevealItem key={`${titleText}-${index}`} sx={{ display: 'grid', gridTemplateColumns: '28px 1fr', columnGap: 1.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100%' }}>
                <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: 'text.disabled', mt: 0.75 }} />
                <Box sx={{ width: 3, flex: 1, bgcolor: 'divider', my: 0.5, minHeight: description ? 56 : 32 }} />
              </Box>
              <Box sx={{ pb: index < rows.length - 1 ? 3 : 0 }}>
                <Typography fontWeight={800} color="text.primary">
                  {titleText || t('profile:not_updated')}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {subtitle}
                  </Typography>
                )}
                {period && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    {period}
                  </Typography>
                )}
                {description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                    {description}
                  </Typography>
                )}
              </Box>
            </ScrollRevealItem>
          );
        })}
      </Stack>
    </ScrollRevealGroup>
  );
};

const ShareableContentSection = ({ summary, tags = [], t }) => {
  const hasSummary = !!summary?.trim();
  if (!hasSummary && tags.length === 0) return null;
  return (
    <ScrollRevealGroup stagger={0.08}>
      <ScrollRevealItem>
      <Typography variant="h5" fontWeight={800} color="primary.main" mb={2} display="flex" alignItems="center" gap={1}>
        <WorkspacePremiumIcon /> {t('profile:shareable_content_section', { defaultValue: 'Nội dung có thể chia sẻ' })}
      </Typography>
      </ScrollRevealItem>
      {hasSummary && (
        <ScrollRevealItem><Typography color="text.secondary" sx={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: 1.7, mb: tags.length ? 2 : 0 }}>
          {summary.trim()}
        </Typography></ScrollRevealItem>
      )}
      {tags.length > 0 && (
        <ScrollRevealItem sx={{ mt: hasSummary ? 2 : 0 }}>
          <Typography variant="h6" fontWeight={800} color="primary.main" mb={1.5} display="flex" alignItems="center" gap={1}>
            <VerifiedIcon fontSize="small" /> {t('profile:skills_section', { defaultValue: 'Kỹ năng' })}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tags.map((tag, idx) => (
              <MentorshipTag key={`${tag}-${idx}`} label={tag} />
            ))}
          </Box>
        </ScrollRevealItem>
      )}
    </ScrollRevealGroup>
  );
};

const ExtendedProfileSections = ({ raw, t }) => {
  const parsed = parseExtendedProfile(raw);
  if (!parsed || typeof parsed !== 'object') return null;

  const sectionLabels = getSectionLabels(t);
  const sections = ['educations', 'experiences', 'projects', 'awards', 'skills']
    .map((key) => ({ key, items: Array.isArray(parsed[key]) ? parsed[key] : [] }))
    .filter((s) => s.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <Stack spacing={5}>
      {sections.map(({ key, items }) => (
        <ProfileTimelineSection
          key={key}
          title={sectionLabels[key]}
          icon={SECTION_ICONS[key] || ArticleIcon}
          items={items}
          t={t}
        />
      ))}
    </Stack>
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
  <ScrollRevealGroup stagger={0.08}>
    <ScrollRevealItem
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
    </ScrollRevealItem>

    {feedbacks.length === 0 ? (
      <ScrollRevealItem><Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>{t('profile:no_reviews')}</Typography></ScrollRevealItem>
    ) : (
      <>
        <Stack spacing={3}>
          {feedbacks.map((review) => (
            <ScrollReveal key={review.id}><MentorshipReviewCard
              name={review.menteeName ?? 'Mentee'}
              date={formatDate(review.createdAt, '')}
              avatar={review.menteeAvatarUrl ?? ''}
              rating={review.rating}
              content={review.comment ?? ''}
            /></ScrollReveal>
          ))}
        </Stack>

        {totalPages > 1 && (
          <ScrollRevealItem sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 4 }}>
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
          </ScrollRevealItem>
        )}
      </>
    )}
  </ScrollRevealGroup>
);

const OwnProfile = ({ navigate, isMentorshipPath }) => {
  const { t } = useTranslation(['mentorship', 'profile']);
  const authUser = useAuthStore((state) => state.user);
  const { enqueueSnackbar } = useSnackbar();
  
  const profileQuery = useMyProfile();
  const orgMemberQuery = useMyOrganizationMember();
  const { organization } = useOrganization();

  const mentorQuery = useMyMentorProfile();
  const access = useMentorshipAccessState();
  const menteeQuery = useMyMenteeProfile({ enabled: access.canUseMentorship });
  const expertiseQuery = useMyExpertise({ enabled: access.hasMentorProfile });
  const feedbacksQuery = useMyMentorFeedbacks(0, 50, { enabled: access.isMentorApproved });

  const [feedbackPage, setFeedbackPage] = useState(1);

  const profile = profileQuery.data;
  const orgMember = orgMemberQuery.data;
  const mentor = mentorQuery.data;
  const mentee = menteeQuery.data;
  const expertise = useMemo(() => expertiseQuery.data ?? [], [expertiseQuery.data]);
  const feedbacks = useMemo(() => feedbacksQuery.data?.items ?? [], [feedbacksQuery.data]);

  const shouldUseMentorDisplayData = isMentorshipPath && access.hasMentorProfile;
  // Derived user details
  const coverUrl = resolveMediaUrl(profile?.coverUrl) || (shouldUseMentorDisplayData ? MENTORSHIP_COVER : DEFAULT_COVER);
  const currentJobTitle = profile?.currentJobTitle || mentor?.currentJobTitle;
  const currentCompany = profile?.currentCompany || mentor?.currentCompany;
  const personalBio = profile?.bio;
  const extendedProfile = (shouldUseMentorDisplayData ? mentor?.extendedProfile : null) || profile?.extendedProfile;

  const user = {
    name: profile?.fullName ?? t('profile:my_account'),
    role: isMentorshipPath
      ? (access.hasMentorProfile
        ? 'Mentor'
        : access.hasMenteeProfile
          ? 'Mentee'
          : resolveProfileRoleLabel({ profile, academicProfile: orgMember, t }))
      : resolveProfileRoleLabel({ profile, academicProfile: orgMember, t }),
    avatar: resolveMediaUrl(profile?.avatarUrl ?? ''),
    cover: coverUrl,
  };

  const tabs = isMentorshipPath
    ? (access.isMentorApproved
      ? getMentorProfileTabs(t)
      : access.hasMenteeProfile
        ? getMenteeProfileTabs(t)
        : access.hasMentorProfile
          ? getMentorshipProfileOnlyTabs(t)
          : [])
    : [];

  useEffect(() => {
    if (isMentorshipPath && access.isMentorPending) {
      navigate('/mentorship', { replace: true });
    }
  }, [access.isMentorPending, isMentorshipPath, navigate]);

  useEffect(() => {
    if (profileQuery.isError) {
      enqueueSnackbar(t('profile:error_load_profile', { defaultValue: 'Không thể tải thông tin hồ sơ. Vui lòng thử lại.' }), { variant: 'error' });
    }
  }, [profileQuery.isError, enqueueSnackbar, t]);

  if (profileQuery.isLoading || orgMemberQuery.isLoading || (isMentorshipPath && access.isLoading)) {
    return (
      <Page title={t('profile:page_title_profile')}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <LoadingSkeleton />
        </Box>
      </Page>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <Page title={t('profile:page_title_profile')}>
        <Box sx={{ maxWidth: 720, mx: 'auto', py: 6, px: 2, textAlign: 'center' }}>
          <Typography color="error">
            {t('profile:error_load_profile', { defaultValue: 'Không thể tải thông tin hồ sơ. Vui lòng thử lại.' })}
          </Typography>
        </Box>
      </Page>
    );
  }

  if (isMentorshipPath && access.isMentorPending) {
    return null;
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
          <Grid size={{ xs: 12 }} sx={{ pb: 2 }}><ScrollReveal>
            <ProfileSectionTitle icon={PersonIcon}>{t('profile:intro_section')}</ProfileSectionTitle>
            <Typography
              color={hasBio ? 'text.secondary' : 'text.disabled'}
              sx={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: hasBio ? 'normal' : 'italic' }}
            >
              {personalBio?.trim() || t('profile:no_bio')}
            </Typography>
          </ScrollReveal></Grid>

          <Grid size={{ xs: 12, lg: 4 }}><ScrollReveal direction="right">
            <Box sx={{ height: '100%' }}>
              <ProfileSectionTitle icon={BusinessIcon}>{t('profile:basic_info')}</ProfileSectionTitle>
              <Box>
                {personalFields.map((field, index) => (
                  <PersonalInfoRow key={index} icon={field.icon} label={field.label} value={field.value} />
                ))}
                <SocialLinksRenderer linksRaw={profile?.links} />
              </Box>
            </Box>
          </ScrollReveal></Grid>

          <Grid size={{ xs: 12, lg: 8 }}><ScrollReveal direction="left">
            <AcademicInfoSection
              academicProfile={{
                ...orgMember,
                organizationName: orgMember?.organizationName || organization?.name,
              }}
            />
          </ScrollReveal></Grid>
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
              <Button variant="contained" size="large" sx={{ borderRadius: 2 }} onClick={() => navigate('/mentorship/mentee-signup')}>
                {t('profile:find_mentor_btn')}
              </Button>
              <Button variant="outlined" size="large" sx={{ borderRadius: 2 }} onClick={() => navigate('/mentorship/signup')}>
                {t('profile:become_mentor_btn')}
              </Button>
            </Stack>
          </Box>
        );
      }
      return null;
    }

    if (access.hasMentorProfile) {
      const mentorExtended = parseExtendedProfile(mentor?.extendedProfile);
      const summary = mentorExtended.experienceSummary ?? '';
      const mentorTopicFallback = normalizeTags(mentor?.expertiseTopics);
      const expertiseTags = expertise.map((e) => e.tag || e.topic).flatMap(normalizeTags);
      const stats = [
        { value: expertise.length || mentorTopicFallback.length, label: t('profile:stats_expertise') },
        { value: mentor?.totalSessions ?? 0, label: t('profile:stats_sessions') },
        { value: formatRating(mentor?.ratingAvg), label: t('profile:stats_rating') },
        { value: feedbacks.length, label: t('profile:stats_feedbacks') },
      ];
      const tags = Array.from(new Set([
        ...normalizeTags(mentor?.expertiseTags),
        ...normalizeTags(mentorExtended.expertiseTags),
        ...expertiseTags,
        ...mentorTopicFallback,
      ]));

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

          <ShareableContentSection summary={summary} tags={tags} t={t} />

          <ExtendedProfileSections raw={mentor?.extendedProfile} t={t} />

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
            <Typography color={mentee?.mentoringGoal?.trim() ? 'text.secondary' : 'text.disabled'} sx={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: mentee?.mentoringGoal?.trim() ? 'normal' : 'italic' }}>
              {mentee?.mentoringGoal?.trim() || t('profile:no_mentee_goal')}
            </Typography>
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
        mode={isMentorshipPath
          ? (access.hasMentorProfile ? 'mentor' : access.hasMenteeProfile ? 'menteeOwn' : 'user')
          : 'user'}
        contentSx={isMentorshipPath ? { pb: { xs: 4, md: 8 } } : undefined}
      >
        <Stack spacing={6}>
          {isMentorshipPath ? (
            renderMentorshipSection()
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
  const { enqueueSnackbar } = useSnackbar();

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
      navigate('/mentorship/profile', { replace: true });
    }
  }, [isOwnProfile, navigate]);

  useEffect(() => {
    if (profileQuery.isError) {
      enqueueSnackbar(t('profile:error_load_mentor'), { variant: 'error' });
    }
  }, [profileQuery.isError, enqueueSnackbar, t]);

  if (isOwnProfile) {
    return null;
  }

  if (profileQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <LoadingSkeleton />
      </Box>
    );
  }

  if (profileQuery.isError || !mentor) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', py: 6, px: 2, textAlign: 'center' }}>
        <Typography color="error">{t('profile:error_load_mentor')}</Typography>
      </Box>
    );
  }

  const user = {
    name: mentor.fullName ?? `Mentor #${mentor.memberId}`,
    role: 'Mentor',
    avatar: resolveMediaUrl(mentor.avatarUrl ?? ''),
    cover: resolveMediaUrl(mentor.coverUrl) || MENTORSHIP_COVER,
  };

  const stats = [
    { value: expertise.length || (mentor.expertiseTopics?.length ?? 0), label: t('profile:stats_expertise') },
    { value: mentor.totalSessions ?? 0, label: t('profile:stats_sessions') },
    { value: formatRating(mentor.ratingAvg), label: t('profile:stats_rating') },
  ];

  const mentorExtended = parseExtendedProfile(mentor.extendedProfile);
  const tags = Array.from(new Set([
    ...normalizeTags(mentor.expertiseTags),
    ...normalizeTags(mentorExtended.expertiseTags),
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
        <ScrollRevealGroup stagger={0.09} sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {access.needsOrgVerification && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {t('profile:preview_mode_warning')}
          </Alert>
        )}

        <Typography variant="h3" fontWeight={800} color="primary.main" textAlign="center">
          {t('profile:mentor_public_heading')}
        </Typography>

        <StatsBanner items={stats} />
        </ScrollRevealGroup>

      <Box sx={{ mt: 5 }}>
        <ShareableContentSection
          summary={mentorExtended.experienceSummary ?? ''}
          tags={tags}
          t={t}
        />
      </Box>

      <Box sx={{ mt: 5 }}>
        <ExtendedProfileSections raw={mentor.extendedProfile} t={t} />
      </Box>

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
