import { Button, Stack } from '@mui/material';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMentorshipAccessState } from '../../hooks/mentorship/useMentorshipAccessState';
import { MENTORSHIP_BROWSE } from '../../constants/mentorshipNav';

const MentorshipHubActions = ({ variant = 'hub' }) => {
  const navigate = useOrgNavigate();
  const access = useMentorshipAccessState();

  const goToLogin = () => navigate('/auth/login');

  if (access.isGuest) {
    return (
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button variant="contained" onClick={goToLogin}>
          Đăng nhập
        </Button>
        <Button variant="outlined" onClick={() => navigate('/auth/register')}>
          Tạo tài khoản
        </Button>
      </Stack>
    );
  }

  if (access.needsEmailVerification) {
    return (
      <Button variant="contained" color="warning" onClick={() => navigate('/settings/account')}>
        Xác thực email để tiếp tục
      </Button>
    );
  }

  if (access.needsOrgVerification) {
    return (
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button variant="contained" color="warning" onClick={() => navigate('/settings/account')}>
          Xác minh học vấn để đặt lịch
        </Button>
        <Button variant="outlined" onClick={() => navigate(MENTORSHIP_BROWSE)}>
          Xem trước cố vấn
        </Button>
      </Stack>
    );
  }

  if (access.isLoading) {
    return (
      <Button variant="outlined" onClick={() => navigate('/development/mentorship/my-bookings')}>
        Lịch hẹn của tôi
      </Button>
    );
  }

  const myBookingsBtn = (
    <Button variant="outlined" onClick={() => navigate('/development/mentorship/my-bookings')}>
      Lịch hẹn của tôi
    </Button>
  );

  const browseBtn = (
    <Button variant="contained" onClick={() => navigate(MENTORSHIP_BROWSE)}>
      Tìm cố vấn
    </Button>
  );

  if (variant === 'landing') {
    if (access.isMentorApproved) {
      return (
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          {browseBtn}
          <Button variant="outlined" onClick={() => navigate('/development/mentorship/dashboard')}>
            Quản lý lịch
          </Button>
        </Stack>
      );
    }
    return (
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {browseBtn}
        {myBookingsBtn}
      </Stack>
    );
  }

  if (access.isMentorApproved) {
    return (
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {myBookingsBtn}
        <Button variant="outlined" onClick={() => navigate('/development/mentorship/profile')}>
          Trang cá nhân
        </Button>
        <Button variant="contained" onClick={() => navigate('/development/mentorship/dashboard')}>
          Quản lý lịch
        </Button>
      </Stack>
    );
  }

  if (access.isMentorPending) {
    return (
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {myBookingsBtn}
        <Button variant="outlined" onClick={() => navigate('/development/mentorship/profile')}>
          Xem hồ sơ đã gửi
        </Button>
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      {myBookingsBtn}
      <Button variant="outlined" onClick={() => navigate('/development/mentorship/mentee-signup')}>
        Hoàn thiện hồ sơ Mentorship
      </Button>
      <Button variant="contained" onClick={() => navigate('/development/mentorship/signup')}>
        Trở thành cố vấn
      </Button>
    </Stack>
  );
};

export default MentorshipHubActions;
