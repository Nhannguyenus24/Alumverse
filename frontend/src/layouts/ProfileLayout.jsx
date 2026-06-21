import { useCallback, useMemo } from 'react';
import { Box, Container, Stack, Typography, Avatar, Button } from '@mui/material';
import TopTabFilter from '../components/mentorship/TopTabFilter';
import CoverUpload from '../components/CoverUpload';

const ProfileLayout = ({
  user,
  tabs,
  onNavigate,
  mode = 'mentor', // 'mentor' | 'mentorEdit' | 'mentee' for MENTORSHIP PROFILE
                   // 'user' | 'userEdit' | 'userView' for USER PROFILE
  cover,
  onCoverChange,
  mentorId,
  canBook = true,
  onUserMessage,
  userMessageLabel = 'Nhắn tin',
  children,
  avatarSlot
}) => {

  const handleBack = useCallback(() => {
    if (window.history.length > 1) { window.history.back(); }
    else { onNavigate('/'); }
  }, [onNavigate]);

  const BUTTON_CONFIG = useMemo(() => ({
    mentor: [
      { label: 'Về trang Cố vấn', variant: 'outlined', onClick: () => onNavigate('/development/mentorship') },
      { label: 'Sửa trang cá nhân', variant: 'outlined', color: 'secondary', onClick: () => onNavigate('/development/mentorship/profile/edit') },
    ],
    mentorEdit: [
      //{ label: 'Huỷ', variant: 'outlined', color: 'secondary', onClick: () => onNavigate('/development/mentorship/profile') },
      //{ label: 'Lưu thay đổi', variant: 'contained', onClick: () => onNavigate('/development/mentorship/profile') },
    ],
    menteeOwn: [
      { label: 'Chỉnh sửa hồ sơ', variant: 'outlined', onClick: () => onNavigate('/development/mentorship/mentee-signup') },
      { label: 'Trở thành cố vấn', variant: 'contained', color: 'primary', onClick: () => onNavigate('/development/mentorship/signup') },
    ],
    mentee: [
      { label: 'Về trang Cố vấn', variant: 'outlined', onClick: () => onNavigate('/development/mentorship') },
      { label: 'Đặt lịch hẹn', variant: 'contained', disabled: !canBook, onClick: canBook ? () => onNavigate(`/development/mentorship/mentors/${mentorId}/book`) : undefined },
    ],
    user: [
      { label: 'Quay lại', variant: 'outlined', onClick: handleBack },
      { label: 'Sửa trang cá nhân', variant: 'outlined', color: 'secondary', onClick: () => onNavigate('/profile/edit') },
    ],
    userEdit: [
      //{ label: 'Huỷ', variant: 'outlined', color: 'secondary', onClick: () => onNavigate('/profile') },
      //{ label: 'Lưu thay đổi', variant: 'contained', onClick: () => onNavigate('/profile') },
    ],
    userView: [
      { label: 'Quay lại', variant: 'outlined', onClick: handleBack },
      { label: userMessageLabel, variant: 'contained', disabled: !onUserMessage, onClick: onUserMessage },
    ],
  }), [onNavigate, mentorId, canBook, handleBack, onUserMessage, userMessageLabel]);

  const renderButtons = () =>
    (BUTTON_CONFIG[mode] ?? []).map(({ label, ...props }, i) => (
      <Button key={i} {...props}>{label}</Button>
    ));
  
  const isEditMode = mode === 'mentorEdit' || mode === 'userEdit';

  return (
    <Box sx={{ pb: 6 }}>
      {/* ================= COVER ================= */}
      <Box>
        {isEditMode ? (
          <CoverUpload value={cover} onChange={onCoverChange} />
        ) : (
          <Box
            sx={{
              height: { xs: 130, md: 180 },
              backgroundImage: `url(${cover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <Box sx={{ backgroundColor: 'background.paper', pb: { xs: 3, md: 0 } }}>
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'center', md: 'flex-end' },
                textAlign: { xs: 'center', md: 'left' },
                gap: 2,
              }}
            >
              {/* AVATAR + NAME */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'center', md: 'flex-end' },
                  gap: 2,
                }}
              >
                <Box sx={{ position: 'relative', width: 140, height: 140, mt: { xs: -7, md: '-40px', borderRadius: '50%', overflow: 'hidden', } }}>
                  {avatarSlot ?? (
                    <Avatar
                      src={user.avatar}
                      sx={{
                        width: 140,
                        height: 140,
                        border: '5px solid white',
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ pb: { md: 1 } }}>
                  <Typography variant="h2" fontWeight={800}>
                    {user.name}
                  </Typography>
                  <Typography color="primary.main" fontWeight={600}>
                    {user.role}
                  </Typography>
                </Box>
              </Box>

              {/* BUTTONS */}
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ pb: { md: 1 }, width: { xs: '100%', sm: 'auto' } }}>
                {renderButtons()}
              </Stack>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* ================= MAIN ================= */}
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Stack spacing={6}>
          {/* TAB FILTER */}
          {(tabs?.length ?? 0) > 1 && (
            <TopTabFilter tabs={tabs} onNavigate={onNavigate}
            />
          )}

          {/* PAGE CONTENT */}
          {children}
          
        </Stack>
      </Container>
    </Box>
  );
};

export default ProfileLayout;
