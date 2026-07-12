import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';



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
  disableMediaEditing = false,
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
  
  const isEditMode = (mode === 'mentorEdit' || mode === 'userEdit') && !disableMediaEditing;

  return (
    <Box sx={{ pb: 6, backgroundColor: 'background.default' }}>
      {/* ================= COVER ================= */}
      <Box>
        <ScrollReveal direction="none" duration={0.78} amount={0.05}>
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
        </ScrollReveal>

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
              <ScrollRevealGroup
                stagger={0.1}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'center', md: 'flex-end' },
                  gap: 2,
                }}
              >
                <ScrollRevealItem
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
                </ScrollRevealItem>

                <ScrollRevealItem sx={{ pb: { md: 1 } }}>
                  <Typography variant="h2" fontWeight={800}>
                    {user.name}
                  </Typography>
                  <Typography color="primary.main" fontWeight={600}>
                    {user.role}
                  </Typography>
                </ScrollRevealItem>
              </ScrollRevealGroup>

              {/* BUTTONS */}
              <ScrollReveal direction="left" delay={0.12} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ pb: { md: 1 }, width: '100%' }}>
                  {renderButtons()}
                </Stack>
              </ScrollReveal>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* ================= MAIN ================= */}
      <Container maxWidth="lg" sx={{ mt: 6, ...contentSx }}>
        <Stack spacing={6}>
          {/* TAB FILTER */}
          {(tabs?.length ?? 0) > 1 && (
            <ScrollReveal>
              <TopTabFilter tabs={tabs} onNavigate={onNavigate} />
            </ScrollReveal>
          )}

          {/* PAGE CONTENT */}
          {children}
          
        </Stack>
      </Container>
    </Box>
  );
};

export default ProfileLayout;
