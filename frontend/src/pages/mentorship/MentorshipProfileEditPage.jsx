import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import Page from '../../components/Page';
import MentorshipProfileLayout from '../../layouts/ProfileLayout';
import MentorshipTag from '../../components/mentorship/MentorshipTag';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyExpertise } from '../../hooks/mentorship/useMyExpertise';
import { useUpdateMentorProfile } from '../../hooks/mentorship/useUpdateMentorProfile';
import { useUploadImage } from '../../hooks/images/useUploadImage';

const TOP_TABS = [
  { label: 'Trang cá nhân', path: '/development/mentorship/profile' },
  { label: 'Dashboard', path: '/development/mentorship/dashboard' },
  { label: 'Lịch cá nhân', path: '/development/mentorship/calendar' },
];

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

const MentorshipProfileEditPage = () => {
  const navigate = useOrgNavigate();

  const profileQuery = useMyMentorProfile();
  const expertiseQuery = useMyExpertise();
  const { updateProfile, isPending: saving, errorMessage } = useUpdateMentorProfile();

  const [coverPreview, setCoverPreview] = useState(DEFAULT_COVER);
  const [coverFile, setCoverFile] = useState(null);
  const [currentJobTitle, setCurrentJobTitle] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [bio, setBio] = useState('');
  const [defaultMeetingLink, setDefaultMeetingLink] = useState('');
  const [success, setSuccess] = useState(false);
  const { uploadFile, isPending: uploadingCover } = useUploadImage();

  // Hydrate form when profile loads
  useEffect(() => {
    const p = profileQuery.data;
    if (p) {
      setCurrentJobTitle(p.currentJobTitle ?? '');
      setCurrentCompany(p.currentCompany ?? '');
      setBio(p.bio ?? '');
      setDefaultMeetingLink(p.defaultMeetingLink ?? '');
      if (p.coverUrl) setCoverPreview(p.coverUrl);
    }
  }, [profileQuery.data]);

  // Cleanup blob preview
  useEffect(() => {
    const url = coverPreview;
    return () => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [coverPreview]);

  const expertise = useMemo(
    () => expertiseQuery.data ?? [],
    [expertiseQuery.data],
  );
  const tags = useMemo(
    () => expertise.map((e) => e.tag || e.topic).filter(Boolean),
    [expertise],
  );

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
        currentJobTitle: currentJobTitle.trim(),
        currentCompany: currentCompany.trim(),
        bio: bio.trim(),
        coverUrl: uploadedCoverUrl ?? undefined,
        defaultMeetingLink: defaultMeetingLink.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate('/development/mentorship/profile'), 800);
    } catch (_e) {
      /* surfaced via errorMessage */
    }
  };

  if (profileQuery.isLoading) {
    return (
      <Page title="Chỉnh sửa hồ sơ">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Page title="Chỉnh sửa hồ sơ">
        <Box sx={{ maxWidth: 720, mx: 'auto', py: 6, px: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Bạn chưa có hồ sơ cố vấn. Hãy đăng ký trước khi chỉnh sửa.
          </Alert>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate('/development/mentorship')}>
              Về trang Cố vấn
            </Button>
            <Button variant="contained" onClick={() => navigate('/development/mentorship/signup')}>
              Trở thành cố vấn
            </Button>
          </Stack>
        </Box>
      </Page>
    );
  }

  const profile = profileQuery.data;
  const user = {
    name: profile.fullName ?? `Mentor #${profile.memberId}`,
    role: [profile.currentJobTitle, profile.currentCompany]
      .filter(Boolean)
      .join(' @ ') || 'Cố vấn',
    avatar: profile.avatarUrl ?? '',
    cover: coverPreview,
  };

  return (
    <Page title="Chỉnh sửa hồ sơ">
      <MentorshipProfileLayout
        user={user}
        cover={coverPreview}
        onCoverChange={handleCoverUpload}
        tabs={TOP_TABS}
        onNavigate={navigate}
        mode="mentorEdit"
      >
        <Stack spacing={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Typography variant="h2" fontWeight={800} color="primary.main">
              CHỈNH SỬA TRANG CÁ NHÂN
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/development/mentorship/profile')}
                disabled={saving}
              >
                Huỷ
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={saving || uploadingCover}>
                {saving || uploadingCover ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </Stack>
          </Box>

          {success && (
            <Alert severity="success">Đã lưu hồ sơ. Đang chuyển về trang cá nhân...</Alert>
          )}
          {errorMessage && !success && <Alert severity="error">{errorMessage}</Alert>}

          {/* CURRENT POSITION */}
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
              Vị trí hiện tại
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                label="Chức danh"
                value={currentJobTitle}
                onChange={(e) => setCurrentJobTitle(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Công ty"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                fullWidth
                size="small"
              />
            </Stack>
          </Box>

          {/* BIO EDIT */}
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
              Giới thiệu
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Nhập mô tả về bạn..."
            />
          </Box>

          {/* DEFAULT MEETING LINK */}
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
              Link cuộc họp mặc định
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="VD: https://meet.google.com/abc-defg-hij"
              value={defaultMeetingLink}
              onChange={(e) => setDefaultMeetingLink(e.target.value)}
            />
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              Mentee sẽ nhận link này khi bạn duyệt yêu cầu.
            </Typography>
          </Box>

          {/* EXPERTISE (read-only here — managed in signup flow) */}
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
              Nội dung có thể chia sẻ
            </Typography>
            {tags.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Chưa có nội dung nào.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map((tag, idx) => (
                  <MentorshipTag key={idx} label={tag} />
                ))}
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              {/* TODO: build a dedicated expertise CRUD section once BE supports inline edit */}
              Hiện chỉ có thể quản lý nội dung từ luồng đăng ký lại. Tính năng chỉnh sửa sẽ sớm có.
            </Typography>
          </Box>
        </Stack>
      </MentorshipProfileLayout>
    </Page>
  );
};

export default MentorshipProfileEditPage;
