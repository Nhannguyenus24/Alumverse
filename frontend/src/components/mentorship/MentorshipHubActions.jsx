import { useTranslation } from 'react-i18next';
import { Button, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PersonIcon from '@mui/icons-material/Person';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';

/**
 * Call-to-action buttons shown on the mentorship landing/hub.
 *
 * @param {{ tone?: 'default' | 'onPrimary' }} props
 *   tone="onPrimary" renders primary buttons for the guest hero banner.
 */
const MentorshipHubActions = ({ tone = 'default' }) => {
  const { t } = useTranslation(['mentorship', 'auth']);
  const navigate = useOrgNavigate();
  const access = useMentorshipAccessState();

  const onPrimary = tone === 'onPrimary';
  const outlinedOnPrimarySx = onPrimary
    ? {
        color: 'primary.main',
        borderColor: 'primary.main',
        '&:hover': {
          borderColor: 'primary.dark',
          bgcolor: 'primary.lighter',
        },
      }
    : undefined;
  const verificationCtaSx = onPrimary
    ? {
        color: 'accent.dark',
        borderColor: 'accent.main',
        '&:hover': {
          borderColor: 'accent.dark',
          bgcolor: 'accent.lighter',
        },
      }
    : undefined;

  // Guest: invite to sign in / create account.
  if (access.isGuest) {
    return (
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button variant="contained" color="primary" onClick={() => navigate('/auth/login')}>
          {t('mentorship:login')}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/auth/register')}
          sx={outlinedOnPrimarySx}
        >
          {t('mentorship:create_account')}
        </Button>
      </Stack>
    );
  }

  // Logged in but email not verified yet.
  if (access.needsEmailVerification) {
    return (
      <Button variant="contained" color="accent" onClick={() => navigate('/organization-registration')}>
        {t('mentorship:verify_email_to_start')}
      </Button>
    );
  }

  // Logged in, email verified, but academic info not verified by the faculty.
  // Per requirement: show a guiding message/CTA, do NOT lead to mentor/mentee sign-up.
  if (access.needsOrgVerification) {
    return (
      <Button
        variant={onPrimary ? 'outlined' : 'contained'}
        color={onPrimary ? undefined : 'accent'}
        onClick={() => navigate('/organization-registration')}
        sx={verificationCtaSx}
      >
        {t('mentorship:verify_academic_to_join')}
      </Button>
    );
  }

  if (access.isLoading) {
    return null;
  }

  // Fully eligible but hasn't joined active mentorship yet.
  if (!access.hasJoinedMentorship) {
    if (access.isMentorPending) {
      return null;
    }

    return (
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SearchIcon />}
          onClick={() => navigate('/mentorship/mentee-signup')}
        >
          {t('mentorship:find_mentor_for_me')}
        </Button>
        <Button
          variant="contained"
          color={onPrimary ? undefined : 'accent'}
          startIcon={<SchoolIcon />}
          onClick={() => navigate('/mentorship/signup')}
          sx={onPrimary ? outlinedOnPrimarySx : undefined}
        >
          {access.hasMentorProfile
            ? t('mentorship:continue_mentor_signup')
            : t('mentorship:become_advisor')}
        </Button>
      </Stack>
    );
  }

  // Joined: quick access to personal profile + schedule.
  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      <Button
        variant="outlined"
        color={onPrimary ? undefined : 'primary'}
        startIcon={<EventNoteIcon />}
        onClick={() => navigate('/mentorship/my-bookings')}
        sx={outlinedOnPrimarySx}
      >
        {t('mentorship:my_appointments')}
      </Button>
      <Button
        variant="contained"
        startIcon={<PersonIcon />}
        onClick={() => navigate('/mentorship/profile')}
      >
        {t('mentorship:personal_page')}
      </Button>
    </Stack>
  );
};

export default MentorshipHubActions;
