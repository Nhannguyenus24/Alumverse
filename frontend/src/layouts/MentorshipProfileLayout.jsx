import { Box, Container, Stack, Typography, Avatar, Button } from '@mui/material';
import TopTabFilter from '../components/TopTabFilter';
import CoverUpload from '../components/CoverUpload';

const MentorshipProfileLayout = ({
  user,
  tabs,
  onNavigate,
  mode = 'mentor', // 'mentor' | 'edit' | 'mentee'
  cover,
  onCoverChange,
  children,
}) => {

  const renderButtons = () => {
    switch (mode) {
      case 'edit':
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

      case 'mentee':
        return (
          <>
            <Button variant="outlined">Nhắn tin</Button>
            <Button variant="contained">Đặt lịch hẹn</Button>
          </>
        );

      case 'mentor':
      default:
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
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* ================= COVER ================= */}
      <Box>
        {mode === 'edit' ? (
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
              <Stack direction="row" spacing={1.5} sx={{ pb: { md: 1 } }}>
                {renderButtons()}
              </Stack>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* ================= MAIN ================= */}
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Stack spacing={6}>
          {/* TAB FILTER ALWAYS HERE */}
          <TopTabFilter tabs={tabs} onNavigate={onNavigate} />

          {/* PAGE CONTENT */}
          {children}
          
        </Stack>
      </Container>
    </Box>
  );
};

export default MentorshipProfileLayout;