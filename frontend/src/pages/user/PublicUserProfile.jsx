import React from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Stack,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';

import ProfileLayout from '../../layouts/ProfileLayout';
import UserHighlights from '../../components/profile/UserHighlights';
import { usePublicProfile } from '../../hooks/profile/usePublicProfile';

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

const ProfileItem = ({ label, value, icon: Icon }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      p: 2.5,
      bgcolor: 'background.paper',
      borderRadius: 3,
      boxShadow: '0 2px 12px 0 rgba(0,0,0,0.03)',
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px 0 rgba(0,0,0,0.08)',
        borderColor: 'primary.light',
      },
      height: '100%',
    }}
  >
    {Icon && (
      <Box
        sx={{
          display: 'flex',
          p: 1.5,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          color: 'primary.main',
          mr: 2,
        }}
      >
        <Icon fontSize="small" />
      </Box>
    )}
    <Box sx={{ flex: 1 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} color="text.primary" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
        {value?.trim?.() || value || 'Chưa cập nhật'}
      </Typography>
    </Box>
  </Box>
);

const PublicUserProfile = ({ userId, navigate }) => {
  const profileQuery = usePublicProfile(userId);
  const profile = profileQuery.data;

  if (profileQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <Alert severity="error" sx={{ m: 4 }}>Không tải được hồ sơ người dùng. Vui lòng thử lại.</Alert>
    );
  }

  const user = {
    name: profile.fullName ?? `User #${profile.userId}`,
    role: [profile.currentJobTitle, profile.currentCompany].filter(Boolean).join(' @ ') || 'Thành viên',
    avatar: profile.avatarUrl ?? '',
    cover: profile.coverUrl || DEFAULT_COVER,
  };

  return (
    <ProfileLayout
      user={user}
      cover={user.cover}
      tabs={[]}
      onNavigate={navigate}
      mode="user"
    >
      <Stack spacing={6}>
        <Box>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="h5" fontWeight={800} color="primary.main" mb={2} display="flex" alignItems="center" gap={1}>
                    <PersonIcon /> Giới thiệu
                  </Typography>
                  <Typography color={profile.bio?.trim() ? 'text.secondary' : 'text.disabled'} sx={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: profile.bio?.trim() ? 'normal' : 'italic' }}>
                    {profile.bio?.trim() || 'Người dùng này chưa cập nhật phần giới thiệu.'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h5" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
                <BusinessIcon /> Thông tin cơ bản
              </Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={4}>
                  <ProfileItem label="Họ và tên" value={profile.fullName} icon={PersonIcon} />
                </Grid>
                {profile.email && (
                  <Grid item xs={12} sm={6} md={4}>
                    <ProfileItem label="Email" value={profile.email} icon={EmailIcon} />
                  </Grid>
                )}
                <Grid item xs={12} sm={6} md={4}>
                  <ProfileItem label="Công việc hiện tại" value={profile.currentJobTitle} icon={WorkIcon} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <ProfileItem label="Công ty" value={profile.currentCompany} icon={BusinessIcon} />
                </Grid>
              </Grid>
            </Grid>

          </Grid>
        </Box>

        <UserHighlights userId={userId} navigate={navigate} />

      </Stack>
    </ProfileLayout>
  );
};

export default PublicUserProfile;
