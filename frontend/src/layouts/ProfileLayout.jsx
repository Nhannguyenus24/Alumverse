import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Container, Stack, Typography, Avatar, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SchoolIcon from '@mui/icons-material/School';
import TopTabFilter from '../components/mentorship/TopTabFilter';
import CoverUpload from '../components/CoverUpload';

const profileSurfaceColor = (theme) => (
  theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.background.paper
);

const ProfileLayout = ({
  user,
  tabs,
  onNavigate,
  mode = 'mentor',
  cover,
  onCoverChange,
  coverPositionY,
  onCoverPositionYChange,
  mentorId,
  canBook = true,
  onUserMessage,
  userMessageLabel,
  children,
  avatarSlot,
  contentSx,
}) => {
  const { t } = useTranslation('profile');

  const handleBack = useCallback(() => {
    if (window.history.length > 1) { window.history.back(); }
    else { onNavigate('/'); }
  }, [onNavigate]);

  const resolvedMessageLabel = userMessageLabel ?? t('send_message');

  const BUTTON_CONFIG = useMemo(() => ({
    mentor: [
      { label: t('back_to_mentorship'), variant: 'outlined', startIcon: <ArrowBackIcon />, onClick: () => onNavigate('/mentorship') },
      {
        label: t('edit_mentorship_profile'),
        variant: 'outlined',
        color: 'secondary',
        startIcon: <EditOutlinedIcon />,
        onClick: () => onNavigate('/mentorship/profile/edit', { state: { profileEditContext: 'mentorship' } }),
      },
    ],
    mentorEdit: [],
    menteeOwn: [
      { label: t('edit_mentorship_profile'), variant: 'outlined', color: 'secondary', startIcon: <EditOutlinedIcon />, onClick: () => onNavigate('/mentorship/mentee-signup') },
      { label: t('become_mentor'), variant: 'contained', color: 'accent', startIcon: <SchoolIcon />, onClick: () => onNavigate('/mentorship/signup') },
    ],
    mentee: [
      { label: t('back_to_mentorship'), variant: 'outlined', onClick: () => onNavigate('/mentorship') },
      { label: t('book_appointment'), variant: 'contained', disabled: !canBook, onClick: canBook ? () => onNavigate(`/mentorship/mentors/${mentorId}/book`) : undefined },
    ],
    user: [
      { label: t('back'), variant: 'outlined', onClick: handleBack },
      { label: t('edit_profile'), variant: 'outlined', color: 'secondary', onClick: () => onNavigate('/profile/edit', { state: { profileEditContext: 'profile' } }) },
    ],
    userEdit: [],
    userView: [
      { label: t('back'), variant: 'outlined', onClick: handleBack },
      { label: resolvedMessageLabel, variant: 'contained', disabled: !onUserMessage, onClick: onUserMessage },
    ],
  }), [t, onNavigate, mentorId, canBook, handleBack, onUserMessage, resolvedMessageLabel]);

  const renderButtons = () =>
    (BUTTON_CONFIG[mode] ?? []).map(({ label, ...props }, i) => (
      <Button key={i} {...props}>{label}</Button>
    ));
  
  const isEditMode = mode === 'mentorEdit' || mode === 'userEdit';

  return (
    <Box sx={{ pb: 6, backgroundColor: 'background.default' }}>
      {/* ================= COVER ================= */}
      <Box>
        {isEditMode ? (
          <CoverUpload
            value={cover}
            onChange={onCoverChange}
            heightSx={{ xs: 130, md: 180 }}
            minHeightSx={{ xs: 130, md: 180 }}
            positionY={coverPositionY}
            onPositionYChange={onCoverPositionYChange}
            editLabel={t('edit_cover', { defaultValue: 'Sửa ảnh bìa' })}
            addLabel={t('add_cover', { defaultValue: 'Thêm ảnh bìa' })}
          />
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

        <Box sx={{ backgroundColor: profileSurfaceColor, pb: { xs: 3, md: 0 } }}>
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
                <Box
                  sx={{
                    position: 'relative',
                    width: 140,
                    height: 140,
                    mt: { xs: -7, md: '-40px' },
                    borderRadius: '50%',
                    overflow: 'hidden',
                  }}
                >
                  {avatarSlot ?? (
                    <Avatar
                      src={user.avatar}
                      sx={{
                        width: 140,
                        height: 140,
                        border: (theme) => `5px solid ${profileSurfaceColor(theme)}`,
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
      <Container maxWidth="lg" sx={{ mt: 6, ...contentSx }}>
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
