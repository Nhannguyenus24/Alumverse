import { Box, Container, Stack, Typography, Avatar, Button } from '@mui/material';
import TopTabFilter from '../components/TopTabFilter';
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
  children,
}) => {

  const handleBack = () => {
    if (window.history.length > 1) { window.history.back(); }
    else { onNavigate('/'); }
  };

  const renderButtons = () => {
    switch (mode) {
      
      // ================= MENTOR =================
      case 'mentor':
        return (
          <>
            <Button variant="outlined" onClick={() => onNavigate('/development/mentorship')}>
              Về trang Cố vấn
            </Button>

            <Button variant="contained" color="secondary" onClick={() => onNavigate('/development/mentorship/profile/edit')}>
              Sửa trang cá nhân
            </Button>
          </>
        );

      // ================= MENTOR EDIT =================
      case 'mentorEdit':
        return (
          <>
            <Button variant="outlined" color="secondary" onClick={() => onNavigate('/development/mentorship/profile')}>
              Huỷ
            </Button>

            <Button variant="contained" onClick={() => onNavigate('/development/mentorship/profile')}>
              Lưu thay đổi
            </Button>
          </>
        );

      // ================= MENTEE OWN PROFILE =================
      case 'menteeOwn':
        return (
          <>
            <Button variant="outlined" onClick={() => onNavigate('/development/mentorship/mentee-signup')}>
              Chỉnh sửa hồ sơ
            </Button>

            <Button variant="contained" color="secondary" onClick={() => onNavigate('/development/mentorship/signup')}>
              Trở thành cố vấn
            </Button>
          </>
        );

      // ================= MENTEE VIEWING MENTOR =================
      case 'mentee':
        return (
          <>
            <Button variant="outlined" onClick={() => onNavigate('/development/mentorship')}>
              Về trang Cố vấn
            </Button>

            <Button
              variant="contained"
              disabled={!canBook}
              onClick={canBook ? () => onNavigate(`/development/mentorship/mentors/${mentorId}/book`) : undefined}
            >
              Đặt lịch hẹn
            </Button>
          </>
        );

      // ================= MY USER PROFILE =================
      case 'user':
        return (
          <>
            <Button variant="outlined" onClick={handleBack}>
              Quay lại
            </Button>

            <Button variant="contained" color="secondary" onClick={() => onNavigate('/profile/edit')}>
              Sửa trang cá nhân
            </Button>
          </>
        );

      // ================= USER EDIT =================
      case 'userEdit':
        return (
          <>
            <Button variant="outlined" color="secondary" onClick={() => onNavigate('/profile')}>
              Huỷ
            </Button>

            <Button variant="contained" onClick={() => onNavigate('/profile')}>
              Lưu thay đổi
            </Button>
          </>
        );

      // ================= OTHER PEOPLE VIEWING USER =================
      case 'userView':
        return (
          <>
            <Button variant="outlined" onClick={handleBack}>
              Quay lại
            </Button>

            <Button variant="contained">
              Nhắn tin
            </Button>
          </>
        );

      default:
        return null;
    }
  };
  
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
                <Avatar
                  src={user.avatar}
                  sx={{
                    width: 140,
                    height: 140,
                    border: '5px solid white',
                    mt: { xs: -7, md: '-40px' },
                  }}
                />

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
          {(tabs ?? []).length > 0 && <TopTabFilter tabs={tabs} onNavigate={onNavigate} />}

          {/* PAGE CONTENT */}
          {children}
          
        </Stack>
      </Container>
    </Box>
  );
};

export default ProfileLayout;