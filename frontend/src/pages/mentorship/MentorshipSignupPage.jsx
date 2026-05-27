import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import Page from '../../components/Page';
import MentorSignupTabProfile from '../../components/mentorship/signup/MentorSignupTabProfile';
import MentorSignupTabContent from '../../components/mentorship/signup/MentorSignupTabContent';
import MentorSignupTabTerms from '../../components/mentorship/signup/MentorSignupTabTerms';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyOrganizationMember } from '../../hooks/useMyOrganizationMember';
import { useCreateMentorSignup } from '../../hooks/mentorship/useCreateMentorSignup';

const MIN_VERIFICATION_LEVEL = 2;

const TABS = [
  { key: 'profile', label: 'Thông tin Mentor' },
  { key: 'content', label: 'Nội dung chia sẻ' },
  { key: 'terms', label: 'Điều khoản' },
];

const initialValues = {
  // Tab 1
  avatarFile: null,
  avatarPreview: '',
  cvFile: null,
  currentJobTitle: '',
  currentCompany: '',
  bio: '',
  educations: [],
  experiences: [],
  projects: [],
  awards: [],
  skills: [],
  // Tab 2
  expertises: [],
  defaultMeetingLink: '',
  // Tab 3
  termsAccepted: false,
};

const validateProfile = (v) =>
  Boolean(v.avatarFile) &&
  v.currentJobTitle.trim() &&
  v.currentCompany.trim() &&
  v.bio.trim() &&
  (v.educations ?? []).length > 0 &&
  (v.experiences ?? []).length > 0;

const validateContent = (v) =>
  (v.expertises ?? []).length > 0 &&
  v.expertises.every((e) => e.category && e.name?.trim() && e.description?.trim());

const validateTerms = (v) => Boolean(v.termsAccepted);

const MentorshipSignupPage = () => {
  const navigate = useOrgNavigate();
  const orgMemberQuery = useMyOrganizationMember();
  const submitMutation = useCreateMentorSignup();

  const [tabKey, setTabKey] = useState('profile');
  const [values, setValues] = useState(initialValues);
  const [success, setSuccess] = useState(false);

  const handleChange = (next) => setValues(next);

  const tabValid = useMemo(
    () => ({
      profile: validateProfile(values),
      content: validateContent(values),
      terms: validateTerms(values),
    }),
    [values],
  );

  const allValid = tabValid.profile && tabValid.content && tabValid.terms;

  const handleSubmit = async () => {
    if (!allValid) return;
    try {
      await submitMutation.submit({
        profile: {
          currentJobTitle: values.currentJobTitle.trim(),
          currentCompany: values.currentCompany.trim(),
          bio: values.bio.trim(),
        },
        expertises: values.expertises,
        avatarFile: values.avatarFile,
        coverFile: null,
        defaultMeetingLink: values.defaultMeetingLink?.trim() || null,
        extended: {
          educations: values.educations ?? [],
          experiences: values.experiences ?? [],
          projects: values.projects ?? [],
          awards: values.awards ?? [],
          skills: values.skills ?? [],
        },
      });
      setSuccess(true);
      setTimeout(() => navigate('/development/mentorship/profile'), 1200);
    } catch {
      /* surfaced via submitMutation.errorMessage */
    }
  };

  // ===== Verification gating =====

  if (orgMemberQuery.isFetching) {
    return (
      <Page title="Đăng ký làm cố vấn">
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </Page>
    );
  }

  const verificationLevel = orgMemberQuery.data?.verificationLevel ?? 0;
  const isVerified = verificationLevel >= MIN_VERIFICATION_LEVEL;

  if (!isVerified) {
    return (
      <Page title="Đăng ký làm cố vấn">
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/development/mentorship')}
            sx={{ mb: 2, textTransform: 'none' }}
            color="inherit"
          >
            Về trang Cố vấn
          </Button>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography fontWeight={700} mb={0.5}>
              Bạn chưa đủ điều kiện đăng ký làm cố vấn
            </Typography>
            <Typography variant="body2">
              Tài khoản của bạn cần đạt mức xác minh cấp {MIN_VERIFICATION_LEVEL}. Hiện tại bạn đang ở
              cấp {verificationLevel}. Vui lòng hoàn tất quy trình xác minh tài khoản trước.
            </Typography>
          </Alert>
        </Container>
      </Page>
    );
  }

  // ===== Form =====

  return (
    <Page title="Đăng ký làm cố vấn">
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/development/mentorship')}
          sx={{ mb: 2, textTransform: 'none' }}
          color="inherit"
        >
          Về trang Cố vấn
        </Button>

        <Typography variant="h2" fontWeight={800} color="primary.main" mb={1}>
          ĐĂNG KÝ LÀM CỐ VẤN
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Hoàn tất 3 mục dưới đây để tạo hồ sơ cố vấn của bạn.
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Đã tạo hồ sơ cố vấn thành công! Đang chuyển sang trang cá nhân...
          </Alert>
        )}

        {submitMutation.errorMessage && !success && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitMutation.errorMessage}
          </Alert>
        )}

        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <Tabs
            value={tabKey}
            onChange={(_, v) => setTabKey(v)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {TABS.map((t) => (
              <Tab
                key={t.key}
                value={t.key}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{t.label}</span>
                    {tabValid[t.key] && (
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'success.main',
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </Stack>
                }
              />
            ))}
          </Tabs>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {tabKey === 'profile' && (
              <MentorSignupTabProfile values={values} onChange={handleChange} />
            )}
            {tabKey === 'content' && (
              <MentorSignupTabContent values={values} onChange={handleChange} />
            )}
            {tabKey === 'terms' && (
              <MentorSignupTabTerms values={values} onChange={handleChange} />
            )}
          </Box>
        </Paper>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1.5} mt={3}>
          <Button variant="outlined" color="inherit" onClick={() => navigate('/development/mentorship')}>
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={!allValid || submitMutation.isPending}
            onClick={handleSubmit}
          >
            {submitMutation.isPending ? 'Đang gửi...' : 'Hoàn thành'}
          </Button>
        </Stack>
      </Container>
    </Page>
  );
};

export default MentorshipSignupPage;
