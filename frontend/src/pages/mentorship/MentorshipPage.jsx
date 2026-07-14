import {
  Box,
  alpha,
  Alert,
  Button,
  Card,
  Stack,
  Typography,
} from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

import AlumniContentLayout from '../../layouts/AlumniContentLayout';
import MentorshipHubActions from '../../components/mentorship/MentorshipHubActions';
import MentorshipMentorListSection from '../../components/mentorship/MentorshipMentorListSection';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useAuth } from '../../hooks/useAuth';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { getMentorshipStats } from '../../constants/mentorshipNav';
import { useTranslation } from 'react-i18next';
import StatsBanner from '../../components/StatsBanner'
import {
  ScrollRevealGroup,
  ScrollRevealItem,
} from '../../components/animations/ScrollReveal';

const getBenefits = (t) => [
  {
    icon: <GroupsOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: t('mentorship:benefit_community_title'),
    description: t('mentorship:benefit_community_desc'),
  },
  {
    icon: <EventAvailableOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: t('mentorship:benefit_flexible_title'),
    description: t('mentorship:benefit_flexible_desc'),
  },
  {
    icon: <VerifiedUserOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: t('mentorship:benefit_trusted_title'),
    description: t('mentorship:benefit_trusted_desc'),
  },
];

const getSteps = (t) => [
  { step: '1', title: t('mentorship:step1_title'), text: t('mentorship:step1_text') },
  { step: '2', title: t('mentorship:step2_title'), text: t('mentorship:step2_text') },
  { step: '3', title: t('mentorship:step3_title'), text: t('mentorship:step3_text') },
];

/** Full marketing landing — guest & level 0 only */
const GuestLandingContent = () => {
  const { t } = useTranslation(['nav', 'mentorship']);
  const access = useMentorshipAccessState();
  const { user, isAuthenticated } = useAuth();
  const navigate = useOrgNavigate();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  return (
    <ScrollRevealGroup stagger={0.09} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ScrollRevealItem><Stack spacing={2}>
        <Typography
          variant="h1"
          fontWeight={800}
          color="primary.main"
          sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
        >
          {t('nav:mentorship').toUpperCase()}
        </Typography>
        <Typography color="text.secondary">
          {t('mentorship:landing_desc')}
        </Typography>
      </Stack></ScrollRevealItem>

      <ScrollRevealItem
        sx={{
          borderRadius: 3,
          px: { xs: 3, md: 5 },
          py: { xs: 4, md: 5 },
          bgcolor: (theme) => theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.18)
            : 'primary.lighter',
          color: (theme) => theme.palette.mode === 'dark' ? 'common.white' : 'text.primary',
          border: '1px solid',
          borderColor: (theme) => theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.32)
            : alpha(theme.palette.primary.main, 0.2),
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? `0 0 34px ${alpha(theme.palette.primary.main, 0.16)}`
            : 'none',
        }}
      >
        <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 2 }}>
          {t('mentorship:landing_overline')}
        </Typography>
        <Typography
          variant="h3"
          fontWeight={800}
          color="primary.main"
          sx={{ mt: 1, mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}
        >
          {t('mentorship:landing_headline')}
        </Typography>
        <Typography sx={{ opacity: 0.92, maxWidth: 840, mb: 3, lineHeight: 1.7 }}>
          {t('mentorship:cta_guest_desc')}
        </Typography>
        <MentorshipHubActions tone="onPrimary" />
      </ScrollRevealItem>

      <ScrollRevealItem><StatsBanner items={getMentorshipStats(t)} /></ScrollRevealItem>

      <ScrollRevealItem>
        <Typography variant="h4" fontWeight={700} mb={3}>
          {t('mentorship:benefits_heading')}
        </Typography>
        <ScrollRevealGroup stagger={0.08}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 2,
          }}
        >
          {getBenefits(t).map((item) => (
            <ScrollRevealItem key={item.title} sx={{ display: 'flex', minWidth: 0 }}>
              <Card
                sx={{
                  p: 3,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
                elevation={0}
              >
              <Box mb={1.5}>{item.icon}</Box>
              <Typography fontWeight={700} mb={1}>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.description}
              </Typography>
              </Card>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </ScrollRevealItem>

      <ScrollRevealItem>
        <Typography variant="h4" fontWeight={700} mb={3}>
          {t('mentorship:steps_heading')}
        </Typography>
        <ScrollRevealGroup stagger={0.08} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {getSteps(t).map((item) => (
            <ScrollRevealItem key={item.step}><Card
              sx={{
                p: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
              }}
              elevation={0}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {item.step}
              </Box>
              <Box>
                <Typography fontWeight={700}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.text}
                </Typography>
              </Box>
            </Card></ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </ScrollRevealItem>

      <ScrollRevealItem><Card
        sx={{
          p: { xs: 3, md: 4 },
          textAlign: 'center',
          border: '1px dashed',
          borderColor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.36 : 0.24),
          bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.06),
        }}
        elevation={0}
      >
        <Typography variant="h5" fontWeight={700} mb={1}>
          {access.isGuest ? t('mentorship:cta_guest_heading') : t('mentorship:cta_verify_heading')}
        </Typography>
        <Typography color="text.secondary" mb={3} maxWidth={520} mx="auto">
          {access.isGuest ? t('mentorship:cta_guest_desc') : t('mentorship:cta_verify_desc')}
        </Typography>
        <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap>
          <MentorshipHubActions />
          {isAdmin && (
            <Button color="secondary" variant="outlined" startIcon={<GroupsOutlinedIcon />} onClick={() => navigate('/admin/mentorship')}>
              {t('mentorship:manage_mentors')}
            </Button>
          )}
          {!access.isGuest && (
            <Button variant="outlined" onClick={() => navigate('/settings')}>
              {t('mentorship:go_to_account_settings')}
            </Button>
          )}
        </Stack>
      </Card></ScrollRevealItem>
    </ScrollRevealGroup>
  );
};

/** Hub header + mentor list — level 1 & 2 */
const HubContent = () => {
  const { t } = useTranslation(['nav', 'mentorship']);
  const { user, isAuthenticated } = useAuth();
  const access = useMentorshipAccessState();
  const navigate = useOrgNavigate();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  return (
    <ScrollRevealGroup stagger={0.09} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ScrollRevealItem><Stack spacing={2}>
        {access.isMentorPending && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography fontWeight={800} mb={0.5}>
              {t('mentorship:mentor_pending_hub_title')}
            </Typography>
            <Typography variant="body2">
              {t('mentorship:mentor_pending_hub_desc')}
            </Typography>
          </Alert>
        )}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Typography
            variant="h1"
            fontWeight={800}
            color="primary.main"
            sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
          >
            {t('mentorship:hub_heading')}
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <MentorshipHubActions />
            {isAdmin && (
              <Button color="secondary" variant="outlined" startIcon={<GroupsOutlinedIcon />} onClick={() => navigate('/admin/mentorship')}>
                {t('mentorship:manage_mentors')}
              </Button>
            )}
          </Stack>
        </Box>
        <Typography color="text.secondary">
          {t('mentorship:hub_desc')}
        </Typography>
      </Stack></ScrollRevealItem>

      <ScrollRevealItem><StatsBanner items={getMentorshipStats(t)} /></ScrollRevealItem>
      <MentorshipMentorListSection />
    </ScrollRevealGroup>
  );
};

const MentorshipPage = () => {
  const { t } = useTranslation(['nav', 'mentorship']);
  const access = useMentorshipAccessState();
  const showGuestLanding = access.isGuest || access.needsEmailVerification;

  return (
    <AlumniContentLayout
      variant="one"
      maxWidth="lg"
      pageTitle={showGuestLanding ? t('mentorship:page_title_landing') : t('mentorship:page_title_hub')}
      header={null}
      contentSpacing={0}
    >
      {showGuestLanding ? <GuestLandingContent /> : <HubContent />}
    </AlumniContentLayout>
  );
};

export default MentorshipPage;
