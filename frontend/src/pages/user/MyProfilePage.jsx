import { Box, CircularProgress, Grid, Stack, Typography } from '@mui/material';

import Page from '../../components/Page';
import ProfileLayout from '../../layouts/ProfileLayout';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyProfile } from '../../hooks/profile/useMyProfile';

const TOP_TABS = [
  { label: 'Trang cá nhân', path: '/profile' },
];

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

const MyProfilePage = () => {
  const navigate = useOrgNavigate();

  const profileQuery = useMyProfile();

  const profile = profileQuery.data;

  if (profileQuery.isLoading) {
    return (
      <Page title="Trang cá nhân">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  const user = {
    name: profile?.fullName ?? 'Tài khoản của tôi',
    role:
      [profile?.currentJobTitle, profile?.currentCompany]
        .filter(Boolean)
        .join(' @ ') || 'Thành viên',
    avatar: profile?.avatarUrl ?? '',
    cover: profile?.coverUrl ?? DEFAULT_COVER,
  };

  return (
    <Page title="Trang cá nhân">
      <ProfileLayout
        user={user}
        cover={user.cover}
        tabs={TOP_TABS}
        onNavigate={navigate}
        mode="user"
      >
        <Stack spacing={4}>
          <Typography variant="h2" fontWeight={800} color="primary.main">
            TRANG CÁ NHÂN
          </Typography>

          {/* TWO COLUMNS */}
          <Grid container spacing={4}>
            {/* LEFT COLUMN - CÁ NHÂN */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
                  Cá nhân
                </Typography>

                <Stack spacing={1.5}>
                  <ProfileItem label="Họ và tên" value={profile?.fullName} />
                  <ProfileItem label="Email" value={profile?.email} />
                  <ProfileItem label="Khoa" value={profile?.facultyName} />
                  <ProfileItem label="Khoá" value={profile?.batchName} />
                  <ProfileItem label="Chương trình" value={formatAcademicValue(profile?.program)} />
                  <ProfileItem label="Chuyên ngành" value={formatAcademicValue(profile?.major)} />
                  <ProfileItem label="Năm tốt nghiệp" value={formatAcademicValue(profile?.graduatedYear)} />
                  <ProfileItem label="Trạng thái tốt nghiệp" value={formatAcademicValue(profile?.graduationStatus)} />
                  <ProfileItem label="Công việc hiện tại" value={profile?.currentJobTitle} />
                  <ProfileItem label="Công ty" value={profile?.currentCompany} />
                  <ProfileItem label="Địa điểm" value={profile?.location} />
                </Stack>
              </Box>
            </Grid>

            {/* RIGHT COLUMN - GIỚI THIỆU */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
                  Giới thiệu
                </Typography>

                <Typography color="text.primary" sx={{ whiteSpace: 'pre-line' }}>
                  {profile?.bio?.trim() || 'Bạn chưa cập nhật phần giới thiệu.'}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* EXTENDED PROFILE */}
          <ExtendedProfileSections raw={profile?.extendedProfile} />
        </Stack>
      </ProfileLayout>
    </Page>
  );
};

const ProfileItem = ({ label, value }) => (
  <Box
    sx={{
      p: 2,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1.5,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>

    <Typography fontWeight={600}>
      {value?.trim?.() || value || 'Chưa cập nhật'}
    </Typography>
  </Box>
);

const formatAcademicValue = (raw) => {
  if (raw == null) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch {
    // fallthrough
  }
  if (Array.isArray(raw)) return raw.join(', ');
  return String(raw);
};

const SECTION_LABELS = {
  educations: 'Học vấn',
  experiences: 'Kinh nghiệm làm việc',
  projects: 'Dự án tiêu biểu',
  awards: 'Giải thưởng',
  skills: 'Kỹ năng & chứng chỉ',
};

const ExtendedProfileSections = ({ raw }) => {
  if (!raw) return null;

  let parsed;

  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;

  const sections = ['educations', 'experiences', 'projects', 'awards', 'skills']
    .map((key) => ({
      key,
      items: Array.isArray(parsed[key]) ? parsed[key] : [],
    }))
    .filter((section) => section.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <Stack spacing={4}>
      {sections.map(({ key, items }) => (
        <Box key={key}>
          <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
            {SECTION_LABELS[key]}
          </Typography>

          <Stack spacing={1.5}>
            {items.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                }}
              >
                {Object.entries(item)
                  .filter(
                    ([, value]) =>
                      value != null && String(value).trim() !== '',
                  )
                  .map(([field, value]) => (
                    <Typography key={field} variant="body2">
                      <Box component="span" fontWeight={600}>
                        {field}:{' '}
                      </Box>

                      {String(value)}
                    </Typography>
                  ))}
              </Box>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
};

export default MyProfilePage;