import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import Page from '../../components/Page';
import ProfileLayout from '../../layouts/ProfileLayout';

import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyProfile } from '../../hooks/profile/useMyProfile';
import { useUpdateProfile } from '../../hooks/profile/useUpdateProfile';
import { useUploadImage } from '../../hooks/images/useUploadImage';

const TOP_TABS = [
  { label: 'Trang cá nhân', path: '/profile' },
];

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

const MyProfileEditPage = () => {
  const navigate = useOrgNavigate();

  const profileQuery = useMyProfile();
  const { updateProfile, isPending: saving, errorMessage } = useUpdateProfile();

  const { uploadFile, isPending: uploadingCover } = useUploadImage();

  const [coverPreview, setCoverPreview] = useState(DEFAULT_COVER);
  const [coverFile, setCoverFile] = useState(null);

  const [bio, setBio] = useState('');

  const [success, setSuccess] = useState(false);

  // HYDRATE FORM
  useEffect(() => {
    const p = profileQuery.data;

    if (p) {
      setBio(p.bio ?? '');

      if (p.coverUrl) {
        setCoverPreview(p.coverUrl);
      }
    }
  }, [profileQuery.data]);

  // Keep academic fields - profile page edit does not currently edit org member, but ensure display compatibility
  useEffect(() => {
    const p = profileQuery.data;
    if (p?.program) {
      try {
        const parsed = typeof p.program === 'string' ? JSON.parse(p.program) : p.program;
        if (Array.isArray(parsed)) {
          // no-op: we only need to ensure rendering components handle arrays
        }
      } catch {
        // ignore
      }
    }
  }, [profileQuery.data]);

  // CLEANUP BLOB URL
  useEffect(() => {
    const url = coverPreview;

    return () => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [coverPreview]);

  const handleCoverUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSuccess(false);

    try {
      let uploadedCoverUrl;

      if (coverFile) {
        uploadedCoverUrl = await uploadFile(coverFile);
      }

      await updateProfile({
        bio: bio.trim(),
        coverUrl: uploadedCoverUrl ?? undefined,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate('/profile');
      }, 800);
    } catch (_e) {
      /* surfaced via errorMessage */
    }
  };

  if (profileQuery.isLoading) {
    return (
      <Page title="Chỉnh sửa trang cá nhân">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  const profile = profileQuery.data;

  const user = {
    name: profile?.fullName ?? 'Tài khoản của tôi',
    role:
      [profile?.currentJobTitle, profile?.currentCompany]
        .filter(Boolean)
        .join(' @ ') || 'Thành viên',
    avatar: profile?.avatarUrl ?? '',
    cover: coverPreview,
  };

  return (
    <Page title="Chỉnh sửa trang cá nhân">
      <ProfileLayout
        user={user}
        cover={coverPreview}
        onCoverChange={handleCoverUpload}
        tabs={TOP_TABS}
        onNavigate={navigate}
        mode="userEdit"
      >
        <Stack spacing={4}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Typography variant="h2" fontWeight={800} color="primary.main">
              CHỈNH SỬA TRANG CÁ NHÂN
            </Typography>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/profile')}
                disabled={saving}
              >
                Huỷ
              </Button>

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || uploadingCover}
              >
                {saving || uploadingCover ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </Stack>
          </Box>

          {success && (
            <Alert severity="success">
              Đã lưu hồ sơ. Đang chuyển về trang cá nhân...
            </Alert>
          )}

          {errorMessage && !success && (
            <Alert severity="error">{errorMessage}</Alert>
          )}

          {/* TWO COLUMNS */}
          <Grid container spacing={4}>
            {/* LEFT COLUMN - CÁ NHÂN */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="primary.main"
                  mb={2}
                >
                  Cá nhân
                </Typography>

                <Stack spacing={1.5}>
                  <ProfileItem
                    label="Họ và tên"
                    value={profile?.fullName}
                  />

                  <ProfileItem
                    label="Email"
                    value={profile?.email}
                  />

                  <ProfileItem
                    label="Khoa"
                    value={profile?.facultyName}
                  />

                  <ProfileItem
                    label="Khoá"
                    value={profile?.batchName}
                  />

                  <ProfileItem
                    label="Công việc hiện tại"
                    value={profile?.currentJobTitle}
                  />

                  <ProfileItem
                    label="Công ty"
                    value={profile?.currentCompany}
                  />

                  <ProfileItem
                    label="Địa điểm"
                    value={profile?.location}
                  />
                </Stack>
              </Box>
            </Grid>

            {/* RIGHT COLUMN - GIỚI THIỆU */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="primary.main"
                  mb={2}
                >
                  Giới thiệu
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  minRows={10}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Nhập mô tả về bạn..."
                />
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
      backgroundColor: 'action.hover',
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
          <Typography
            variant="h4"
            fontWeight={700}
            color="primary.main"
            mb={2}
          >
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

export default MyProfileEditPage;