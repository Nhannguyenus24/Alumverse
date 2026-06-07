import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
  Stack,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Container,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import Page from '../../components/Page';
import Input from '../../components/Input';
import ConfirmDialog from '../../components/ConfirmDialog';
import { 
  getTrustedVerifiers, 
  joinOrganization, 
  requestPeerVerification,
  createVerificationRequest
} from '../../utils/api';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useOrganization } from '../../hooks/useOrganization';
import { fileToBase64 } from '../../utils/imageUtils';
import { z } from 'zod';
import Iconify from '../../components/Iconify';

/**
 * Validation schema for organization registration
 */
const organizationRegistrationSchema = z.object({
  organizationId: z.number().positive('Organization ID must be provided').int(),
  studentCode: z.string().optional().or(z.literal('')),
  className: z.string().optional().or(z.literal('')),
  startYear: z.number().positive('Start year must be positive').int().optional().or(z.literal('')),
  graduatedYear: z.number().positive('Graduated year must be positive').int().optional().or(z.literal('')),
  degreeType: z.string().optional().or(z.literal('')),
});

/**
 * Organization Registration Page
 * Allows users to register/join an organization with academic information
 */
const OrganizationRegistrationPage = () => {
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { organization, loading: organizationLoading } = useOrganization();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [trustedVerifiers, setTrustedVerifiers] = useState([]);
  const [trustedVerifiersLoading, setTrustedVerifiersLoading] = useState(false);
  const [selectedVerifierUserId, setSelectedVerifierUserId] = useState('');
  
  // State for confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingVerifier, setPendingVerifier] = useState(null);

  // Prefer organization ID from context (resolved by slug), keep query param as fallback.
  const queryOrgId = searchParams.get('orgId');
  const parsedQueryOrgId = queryOrgId ? parseInt(queryOrgId, 10) : null;
  const organizationId = organization?.id ?? (Number.isInteger(parsedQueryOrgId) ? parsedQueryOrgId : null);

  const parseOrganizationOptions = (value) => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => String(item ?? '').trim())
        .filter(Boolean);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item ?? '').trim())
            .filter(Boolean);
        }
      } catch {
        return trimmed
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    return [];
  };

  const programOptions = useMemo(
    () => parseOrganizationOptions(organization?.programs),
    [organization?.programs],
  );
  const majorOptions = useMemo(
    () => parseOrganizationOptions(organization?.majors),
    [organization?.majors],
  );

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(organizationRegistrationSchema),
    defaultValues: {
      organizationId: organizationId ?? undefined,
      studentCode: '',
      className: '',
      startYear: undefined,
      graduatedYear: undefined,
      degreeType: '',
    },
  });

  useEffect(() => {
    if (organizationId) {
      setValue('organizationId', organizationId);
      setError(null);
    } else if (!organizationLoading) {
      setError('Organization ID is required. Please provide a valid organization.');
    }
  }, [organizationId, organizationLoading, setValue]);

  useEffect(() => {
    let cancelled = false;

    const loadTrustedVerifiers = async () => {
      if (!organizationId) {
        setTrustedVerifiers([]);
        setSelectedVerifierUserId('');
        return;
      }

      setTrustedVerifiersLoading(true);
      try {
        const response = await getTrustedVerifiers(organizationId);
        const verifiers = Array.isArray(response?.data?.data) ? response.data.data : [];
        if (!cancelled) {
          setTrustedVerifiers(verifiers);
        }
      } catch (err) {
        if (!cancelled) {
          setTrustedVerifiers([]);
          console.error('Failed to load trusted verifiers', err);
        }
      } finally {
        if (!cancelled) {
          setTrustedVerifiersLoading(false);
        }
      }
    };

    loadTrustedVerifiers();

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const handleProofFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ hỗ trợ file PDF, JPG hoặc PNG cho minh chứng.');
      return;
    }

    if (file.size > maxSizeBytes) {
      setError('File minh chứng vượt quá 5MB. Vui lòng chọn file nhỏ hơn.');
      return;
    }

    setError(null);
    setProofFile(file);
  };

  const onSubmit = async (data, verifierIdOverride) => {
    setError(null);
    setLoading(true);
    enqueueSnackbar('Đăng ký đang được xử lý...', { variant: 'info' });

    // When called via handleSubmit(onSubmit), the second argument is the event object.
    // We only want to use it if it's explicitly a verifier ID (string or number).
    const verifierId = (typeof verifierIdOverride === 'string' || typeof verifierIdOverride === 'number')
      ? verifierIdOverride
      : selectedVerifierUserId;

    try {
      // Map form fields to the naming expected by joinOrganization API
      // className -> program, degreeType -> major
      const payload = {
        organizationId: data.organizationId,
        program: data.className ? [data.className] : null,
        major: data.degreeType ? [data.degreeType] : null,
        graduatedYear: data.graduatedYear ? [data.graduatedYear] : null,
        // Keep original fields just in case they are used elsewhere
        ...(data.studentCode && { studentCode: data.studentCode }),
        ...(data.startYear && { startYear: data.startYear }),
      };

      const response = await joinOrganization(payload);

      if (response?.data) {
        // Handle Peer Verification Request
        if (verifierId) {
          try {
            await requestPeerVerification({
              organizationId: data.organizationId,
              verifierUserId: Number(verifierId),
            });
            enqueueSnackbar('Yêu cầu xác thực đồng nghiệp đã được gửi.', { variant: 'success' });
          } catch (peerError) {
            console.error('Failed to request peer verification', peerError);
            enqueueSnackbar('Gửi yêu cầu xác thực thất bại, nhưng đăng ký tổ chức đã thành công.', { variant: 'warning' });
          }
        }

        // Handle Alumni Verification Request (Proof Upload)
        if (proofFile) {
          try {
            const base64File = await fileToBase64(proofFile);
            await createVerificationRequest({
              base64File,
              originalFileName: proofFile.name,
              documentType: proofFile.type === 'application/pdf' ? 'pdf' : 'image',
            });
            enqueueSnackbar('Yêu cầu xác thực minh chứng đã được gửi.', { variant: 'success' });
          } catch (proofError) {
            console.error('Failed to submit verification request', proofError);
            enqueueSnackbar('Gửi yêu cầu xác thực minh chứng thất bại.', { variant: 'error' });
          }
        }

        enqueueSnackbar('Đăng ký tham gia tổ chức thành công!', { variant: 'success' });
        
        // Redirect to organization home page
        navigate("/");
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message 
        || err?.message 
        || 'Failed to register to organization. Please try again.';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleVerifierClick = (verifier) => {
    setSelectedVerifierUserId(String(verifier.userId));
    setPendingVerifier(verifier);
    setConfirmOpen(true);
  };

  const handleConfirmVerification = () => {
    if (pendingVerifier) {
      const currentData = getValues();
      onSubmit(currentData, String(pendingVerifier.userId));
    }
  };

  if (!organizationId && !organizationLoading) {
    return (
      <Page
        title="Organization Registration"
        meta={<meta name="description" content="Register to organization" />}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 2,
          }}
        >
          <Typography variant="h6" color="error">
            Invalid Organization
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Please provide a valid organization to register.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/auth/login', { replace: true })}
          >
            Back to Login
          </Button>
        </Box>
      </Page>
    );
  }

  return (
    <Page
      title="Organization Registration"
      meta={<meta name="description" content="Register to organization" />}
    >
      <Container
        maxWidth="xl"
        sx={{
          pt: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3, lg: 6 },
          pb: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={4}
          sx={{ maxWidth: '1200px', margin: '0 auto', p: { xs: 2, sm: 3 } }}
        >
          {/* Left Section: Form */}
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            <Typography
              variant="h1"
              fontWeight={700}
              color="primary.main"
              sx={{ mb: 1 }}
            >
              ĐĂNG KÝ TỔ CHỨC
            </Typography>

            <Typography
              variant="body1"
              color="textSecondary"
              sx={{ mb: 2 }}
            >
              Vui lòng cung cấp thông tin học thuật của bạn để đăng ký tham gia tổ chức.
            </Typography>

            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Required Fields */}
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} color="primary.main" sx={{ mb: 1 }}>
                Thông tin bắt buộc
              </Typography>
            </Box>

            {/* Organization ID (hidden field) */}
            <input
              type="hidden"
              {...register('organizationId', { valueAsNumber: true })}
            />

            <Input
              label="Mã số sinh viên"
              placeholder="Ví dụ: 1234567"
              error={!!errors.studentCode}
              helperText={errors.studentCode?.message}
              {...register('studentCode')}
            />

            {/* Optional Fields */}
            <Box sx={{ mb: 1, mt: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} color="textSecondary" sx={{ mb: 1 }}>
                Thông tin học thuật (Tùy chọn)
              </Typography>
            </Box>

            {programOptions.length > 0 ? (
              <TextField
                select
                label="Hệ đào tạo"
                error={!!errors.className}
                helperText={errors.className?.message}
                defaultValue=""
                {...register('className')}
              >
                <MenuItem value="">Chọn hệ đào tạo</MenuItem>
                {programOptions.map((program) => (
                  <MenuItem key={program} value={program}>
                    {program}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <Input
                label="Hệ đào tạo"
                placeholder="Ví dụ: K15"
                error={!!errors.className}
                helperText={errors.className?.message}
                {...register('className')}
              />
            )}

            <Stack direction="row" spacing={2}>
              <Input
                label="Năm bắt đầu"
                type="number"
                placeholder="Ví dụ: 2015"
                error={!!errors.startYear}
                helperText={errors.startYear?.message}
                {...register('startYear', { valueAsNumber: true })}
                sx={{ flex: 1 }}
              />
              <Input
                label="Năm tốt nghiệp"
                type="number"
                placeholder="Ví dụ: 2019"
                error={!!errors.graduatedYear}
                helperText={errors.graduatedYear?.message}
                {...register('graduatedYear', { valueAsNumber: true })}
                sx={{ flex: 1 }}
              />
            </Stack>

            {majorOptions.length > 0 ? (
              <TextField
                select
                label="Chuyên ngành"
                error={!!errors.degreeType}
                helperText={errors.degreeType?.message}
                defaultValue=""
                {...register('degreeType')}
              >
                <MenuItem value="">Chọn chuyên ngành</MenuItem>
                {majorOptions.map((major) => (
                  <MenuItem key={major} value={major}>
                    {major}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <Input
                label="Chuyên ngành"
                placeholder="Ví dụ: Khoa học máy tính"
                error={!!errors.degreeType}
                helperText={errors.degreeType?.message}
                {...register('degreeType')}
              />
            )}

            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} color="textSecondary" sx={{ mb: 1 }}>
                Minh chứng (Tùy chọn)
              </Typography>
              <Button variant="outlined" component="label" fullWidth disabled={loading} startIcon={<Iconify icon="eva:cloud-upload-fill" />}>
                {proofFile ? 'Đổi file minh chứng' : 'Tải lên minh chứng'}
                <input
                  hidden
                  type="file"
                  accept=".pdf,image/jpeg,image/png"
                  onChange={handleProofFileChange}
                />
              </Button>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                {proofFile
                  ? `Đã chọn: ${proofFile.name}`
                  : 'Hỗ trợ PDF/JPG/PNG, tối đa 2MB.'}
              </Typography>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined" color="secondary"
                fullWidth
                size="large"
                onClick={() => navigate('/auth/login', { replace: true })}
                disabled={loading}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng ký tham gia'
                )}
              </Button>
            </Box>
          </Box>

          {/* Right Section: Trusted Verifiers */}
          <Box sx={{ width: { xs: '100%', md: '400px' }, flexShrink: 0 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                minHeight: '400px',
                bgcolor: 'primary.lighter',
                borderRadius: 2,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="h3" fontWeight={700} sx={{ color: 'primary.main' }} gutterBottom>
                Người xác thực tin cậy
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Chọn một người bạn quen biết trong tổ chức này để họ xác thực danh tính cho bạn. 
                Việc này giúp quá trình phê duyệt diễn ra nhanh hơn.
              </Typography>

              {trustedVerifiersLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
                  <CircularProgress size={32} />
                  <Typography variant="caption" color="textSecondary">
                    Đang tải danh sách...
                  </Typography>
                </Box>
              ) : trustedVerifiers.length > 0 ? (
                <List sx={{ p: 0, width: '100%', bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden', border: (theme) => `1px solid ${theme.palette.divider}`}}>
                  <ListItem
                    button
                    selected={selectedVerifierUserId === ''}
                    onClick={() => setSelectedVerifierUserId('')}
                    sx={{ 
                      py: 1.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        '&:hover': { bgcolor: 'primary.lighter' }
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'grey.200' }}>
                        <Iconify icon="eva:person-done-outline" sx={{ color: 'text.secondary' }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Không chọn người xác thực" 
                      secondary="Quản trị viên sẽ trực tiếp phê duyệt yêu cầu của bạn."
                      primaryTypographyProps={{ variant: 'subtitle2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  <Divider />
                  {trustedVerifiers.map((verifier) => {
                    const isSelected = String(verifier.userId) === selectedVerifierUserId;
                    return (
                      <Box key={verifier.userId}>
                        <ListItem
                          button
                          selected={isSelected}
                          onClick={() => handleVerifierClick(verifier)}
                          sx={{ 
                            py: 1.5,
                            '&.Mui-selected': {
                              bgcolor: 'primary.lighter',
                              '&:hover': { bgcolor: 'primary.lighter' }
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar src={verifier.avatarUrl} alt={verifier.fullName || verifier.userName}>
                              {(verifier.fullName || verifier.userName || '?').charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={verifier.fullName || verifier.userName}
                            secondary={`${verifier.program || ''} ${verifier.major ? `· ${verifier.major}` : ''}`}
                            primaryTypographyProps={{ 
                              variant: 'subtitle2',
                              color: isSelected ? 'primary.main' : 'text.primary'
                            }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                          {isSelected && (
                            <Iconify icon="eva:checkmark-fill" sx={{ color: 'primary.main', ml: 1 }} />
                          )}
                        </ListItem>
                        <Divider />
                      </Box>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8, px: 2, bgcolor: 'background.paper', borderRadius: 1, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                  <Iconify icon="eva:people-outline" sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Chưa có người xác thực
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Hiện chưa có người xác thực khả dụng cho tổ chức này.
                  </Typography>
                </Box>
              )}

              {selectedVerifierUserId && (
                <Alert 
                  severity="success" 
                  sx={{ mt: 3, bgcolor: 'primary.lighter', color: 'primary.darker', '& .MuiAlert-icon': { color: 'primary.main' } }} 
                  icon={<Iconify icon="eva:info-fill" />}
                >
                  Bạn đã chọn <strong>{
                    trustedVerifiers.find(v => String(v.userId) === selectedVerifierUserId)?.fullName || 'người xác thực'
                  }</strong>. Yêu cầu sẽ được gửi đi sau khi bạn đăng ký.
                </Alert>
              )}
            </Paper>
          </Box>
        </Stack>

        <ConfirmDialog
          open={confirmOpen}
          title="Xác nhận người xác thực"
          message={`Bạn có chắc chắn muốn chọn ${pendingVerifier?.fullName || 'người này'} làm người xác thực cho bạn? Sau khi xác nhận, yêu cầu đăng ký của bạn sẽ được gửi đi ngay lập tức.`}
          confirmText="Xác nhận & Gửi"
          cancelText="Hủy bỏ"
          onConfirm={handleConfirmVerification}
          onCancel={() => setConfirmOpen(false)}
          loading={loading}
        />
      </Container>
    </Page>
  );
};

export default OrganizationRegistrationPage;