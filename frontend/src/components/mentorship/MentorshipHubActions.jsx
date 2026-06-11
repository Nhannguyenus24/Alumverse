import { Button, Stack } from '@mui/material';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';

/**
 * Call-to-action buttons shown on the mentorship landing/hub.
 *
 * @param {{ tone?: 'default' | 'onPrimary' }} props
 *   tone="onPrimary" renders light buttons for the dark hero banner.
 */
const MentorshipHubActions = ({ tone = 'default' }) => {
  const navigate = useOrgNavigate();
  const access = useMentorshipAccessState();

  const onPrimary = tone === 'onPrimary';
  const outlinedOnPrimarySx = onPrimary
    ? {
        color: 'common.white',
        borderColor: 'common.white',
        '&:hover': {
          borderColor: 'common.white',
          bgcolor: 'rgba(255, 255, 255, 0.12)',
        },
      }
    : undefined;

  // Guest: invite to sign in / create account.
  if (access.isGuest) {
    return (
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button variant="contained" onClick={() => navigate('/auth/login')}>
          Đăng nhập
        </Button>
        <Button
          variant="outlined"
          color={onPrimary ? undefined : 'primary'}
          onClick={() => navigate('/auth/register')}
          sx={outlinedOnPrimarySx}
        >
          Tạo tài khoản
        </Button>
      </Stack>
    );
  }

  // Logged in but email not verified yet.
  if (access.needsEmailVerification) {
    return (
      <Button variant="contained" color="warning" onClick={() => navigate('/settings/account')}>
        Xác thực email để bắt đầu
      </Button>
    );
  }

  // Logged in, email verified, but academic info not verified by the faculty.
  // Per requirement: show a guiding message/CTA, do NOT lead to mentor/mentee sign-up.
  if (access.needsOrgVerification) {
    return (
      <Button
        variant={onPrimary ? 'outlined' : 'contained'}
        color={onPrimary ? undefined : 'warning'}
        onClick={() => navigate('/settings/account')}
        sx={outlinedOnPrimarySx}
      >
        Xác minh học vấn tại khoa để tham gia
      </Button>
    );
  }

  if (access.isLoading) {
    return null;
  }

  // Fully eligible but hasn't joined mentorship yet → invite to join.
  if (!access.hasJoinedMentorship) {
    return (
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          onClick={() => navigate('/development/mentorship/mentee-signup')}
        >
          Tìm cố vấn cho tôi
        </Button>
        <Button
          variant="outlined"
          color={onPrimary ? undefined : 'primary'}
          onClick={() => navigate('/development/mentorship/signup')}
          sx={outlinedOnPrimarySx}
        >
          Trở thành cố vấn
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
        onClick={() => navigate('/development/mentorship/my-bookings')}
        sx={outlinedOnPrimarySx}
      >
        Lịch hẹn của tôi
      </Button>
      <Button
        variant="contained"
        onClick={() => navigate('/development/mentorship/profile')}
      >
        Trang cá nhân
      </Button>
    </Stack>
  );
};

export default MentorshipHubActions;
