import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import Page from '../../components/Page';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyOrganizationMember } from '../../hooks/useMyOrganizationMember';
import { useMyMenteeProfile, useSaveMenteeProfile } from '../../hooks/mentorship/useMyMenteeProfile';

const MIN_VERIFICATION_LEVEL = 2;

const ACADEMIC_YEAR_OPTIONS = [
  'Năm 1',
  'Năm 2',
  'Năm 3',
  'Năm 4',
  'Năm 5+',
  'Đã tốt nghiệp',
];

const COMMITMENTS = [
  'Cung cấp thông tin hồ sơ trung thực, rõ ràng và phù hợp với mục đích nhận cố vấn.',
  'Tôn trọng thời gian của cố vấn, phản hồi sớm và báo trước nếu cần hủy hoặc đổi lịch hẹn.',
  'Bảo mật các thông tin cá nhân hoặc nội dung nhạy cảm được chia sẻ trong quá trình trao đổi.',
  'Không sử dụng ngôn từ, hành vi quấy rối, phân biệt đối xử, xúc phạm hoặc vi phạm pháp luật.',
  'Cho phép hệ thống lưu lại lịch sử buổi hẹn và đánh giá để nâng cao chất lượng chương trình.',
];

const initialValues = {
  mentoringGoal: '',
  major: '',
  academicYear: '',
  interests: '',
  termsAccepted: false,
};

const MenteeSignupPage = () => {
  const navigate = useOrgNavigate();
  const orgMemberQuery = useMyOrganizationMember();
  const existingQuery = useMyMenteeProfile();
  const saveMutation = useSaveMenteeProfile();

  const [values, setValues] = useState(initialValues);
  const [hydratedKey, setHydratedKey] = useState(null);
  const [success, setSuccess] = useState(false);

  const hydratedValues = useMemo(() => {
    const p = existingQuery.data;
    if (!p) return null;
    return {
      mentoringGoal: p.mentoringGoal ?? '',
      major: p.major ?? '',
      academicYear: p.academicYear ?? '',
      interests: p.interests ?? '',
      termsAccepted: true,
    };
  }, [existingQuery.data]);

  const hydrationKey = existingQuery.data?.updatedAt
    ?? existingQuery.data?.createdAt
    ?? null;
  if (hydratedValues && hydrationKey && hydratedKey !== hydrationKey) {
    setValues(hydratedValues);
    setHydratedKey(hydrationKey);
  }

  const isValid =
    values.mentoringGoal.trim().length > 0 &&
    values.major.trim().length > 0 &&
    values.academicYear.trim().length > 0 &&
    Boolean(values.termsAccepted);

  const setField = (field) => (event) =>
    setValues((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      await saveMutation.submit({
        mentoringGoal: values.mentoringGoal.trim(),
        major: values.major.trim(),
        academicYear: values.academicYear.trim(),
        interests: values.interests.trim() || undefined,
        termsAccepted: true,
      });
      setSuccess(true);
      setTimeout(() => navigate('/development/mentorship'), 1200);
    } catch {
      /* surfaced via errorMessage */
    }
  };

  if (orgMemberQuery.isFetching) {
    return (
      <Page title="Hoàn thiện hồ sơ Mentorship">
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </Page>
    );
  }

  const verificationLevel = orgMemberQuery.data?.verificationLevel ?? 0;
  const isVerified = verificationLevel >= MIN_VERIFICATION_LEVEL;

  if (!isVerified) {
    const needsEmail = verificationLevel < 1;
    return (
      <Page title="Hoàn thiện hồ sơ Mentorship">
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/development/mentorship')}
            sx={{ mb: 2, textTransform: 'none' }}
            color="inherit"
          >
            Về trang Cố vấn
          </Button>
          <Alert severity="warning">
            <Typography fontWeight={700} mb={0.5}>
              Bạn chưa đủ điều kiện sử dụng tính năng Mentorship
            </Typography>
            <Typography variant="body2">
              {needsEmail
                ? 'Vui lòng xác thực email để tiếp tục sử dụng các tính năng cộng đồng.'
                : 'Bạn cần xác minh thông tin học vấn tại khoa để sử dụng tính năng này.'}
            </Typography>
          </Alert>
        </Container>
      </Page>
    );
  }

  const hasExisting = Boolean(existingQuery.data);

  return (
    <Page title="Hoàn thiện hồ sơ Mentorship">
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
          {hasExisting ? 'CẬP NHẬT HỒ SƠ MENTORSHIP' : 'HOÀN THIỆN HỒ SƠ MENTORSHIP'}
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Cho mentor biết bạn đang ở đâu trên hành trình và muốn được hỗ trợ điều gì.
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Đã lưu hồ sơ Mentee. Đang quay lại trang Cố vấn...
          </Alert>
        )}

        {saveMutation.errorMessage && !success && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveMutation.errorMessage}
          </Alert>
        )}

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Mục tiêu mentoring"
              placeholder="Bạn muốn được hỗ trợ điều gì trong buổi mentoring?"
              value={values.mentoringGoal}
              onChange={setField('mentoringGoal')}
              multiline
              minRows={3}
              required
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Ngành học"
                value={values.major}
                onChange={setField('major')}
                required
                fullWidth
              />
              <TextField
                label="Năm học"
                value={values.academicYear}
                onChange={setField('academicYear')}
                select
                required
                fullWidth
              >
                {ACADEMIC_YEAR_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Lĩnh vực quan tâm"
              placeholder="VD: Backend, AI, Career, Startup..."
              value={values.interests}
              onChange={setField('interests')}
              multiline
              minRows={2}
              fullWidth
              helperText="Cách nhau bằng dấu phẩy"
            />

            <Box>
              <Typography fontWeight={700} mb={1}>
                Điều khoản sử dụng tính năng Mentorship
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, maxHeight: 220, overflowY: 'auto', bgcolor: 'background.default' }}
              >
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Khi sử dụng tính năng Mentorship, người dùng đồng ý:
                </Typography>
                <Box component="ol" sx={{ pl: 3, m: 0 }}>
                  {COMMITMENTS.map((c, i) => (
                    <Typography key={i} component="li" variant="body2" sx={{ mb: 0.5 }}>
                      {c}
                    </Typography>
                  ))}
                </Box>
              </Paper>
              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Checkbox
                    checked={values.termsAccepted}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, termsAccepted: e.target.checked }))
                    }
                  />
                }
                label="Tôi đã đọc và đồng ý với các điều khoản trên"
              />
            </Box>
          </Stack>
        </Paper>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="flex-end"
          spacing={1.5}
          mt={3}
        >
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate('/development/mentorship')}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={!isValid || saveMutation.isPending}
            onClick={handleSubmit}
          >
            {saveMutation.isPending
              ? 'Đang lưu...'
              : hasExisting
                ? 'Cập nhật hồ sơ'
                : 'Hoàn thành'}
          </Button>
        </Stack>
      </Container>
    </Page>
  );
};

export default MenteeSignupPage;
