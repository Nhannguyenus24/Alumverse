import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, Navigate } from 'react-router';
import { useSnackbar } from 'notistack';
import { GoogleLogin } from '@react-oauth/google';
import {
  Box,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
  Divider,
  Paper,
  Card,
  CardContent,
  useTheme,
  alpha,
  Alert,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import Page from '../../components/Page';
import Input from '../../components/Input';
import { loginSchema } from '../../schemas/authSchemas';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import useOrganizationStore from '../../stores/organizationStore';

const AdminLoginPage = () => {
  const theme = useTheme();
  const navigate = useOrgNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { login, loginWithGoogle, isSubmitting: loading, setError, forgotPassword, isAuthenticated } = useAuth();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const organizationId = useOrganizationStore((state) => state.organization?.id);

  const redirectTo = location.state?.from?.pathname || '/admin';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    setError(null);
    const result = await login({ email: data.email, password: data.password, organizationId });
    if (result?.ok) {
      enqueueSnackbar('Đăng nhập admin thành công.', { variant: 'success' });

      // Check if user has admin role
      if (result?.data?.user?.role === 'ADMIN' || result?.data?.user?.role === 'MODERATOR') {
        navigate(redirectTo, { replace: true });
      } else {
        enqueueSnackbar('Bạn không có quyền truy cập trang admin.', { variant: 'error' });
        // Redirect to regular login or home page
        navigate('/', { replace: true });
      }
    } else if (result?.error && result.error.includes('Account is not verified')) {
      const fp = await forgotPassword({ email: data.email });
      if (!fp?.ok) {
        enqueueSnackbar(fp?.error ?? 'Gửi mã xác thực thất bại.', { variant: 'error' });
        return;
      }
      enqueueSnackbar('Mã xác thực đã được gửi đến email của bạn.', { variant: 'success' });
      navigate('/auth/signup-code', { state: { email: data.email } });
    } else if (result?.error) {
      enqueueSnackbar(result.error, { variant: 'error' });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      enqueueSnackbar('Không thể lấy Google token.', { variant: 'error' });
      return;
    }

    setError(null);
    const result = await loginWithGoogle(idToken);
    if (result?.ok) {
      enqueueSnackbar('Đăng nhập Google thành công.', { variant: 'success' });

      // Check if user has admin role
      if (result?.data?.user?.role === 'ADMIN' || result?.data?.user?.role === 'MODERATOR') {
        navigate(redirectTo, { replace: true });
      } else {
        enqueueSnackbar('Bạn không có quyền truy cập trang admin.', { variant: 'error' });
        navigate('/', { replace: true });
      }
      return;
    }

    enqueueSnackbar(result?.error ?? 'Đăng nhập Google thất bại.', { variant: 'error' });
  };

  const handleGoogleError = () => {
    enqueueSnackbar('Đăng nhập Google thất bại.', { variant: 'error' });
  };

  return (
    <Page
      title="Admin Login"
      meta={<meta name="description" content="Đăng nhập trang quản trị hệ thống" />}
    >
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.dark, 0.05)} 100%)`,
          p: 2,
        }}
      >
        <Card
          sx={{
            maxWidth: 480,
            width: '100%',
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 4,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Admin Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              >
                <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 36 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
                Admin Login
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                Đăng nhập vào trang quản trị hệ thống HCMUS Alumni
              </Typography>
              <Alert
                severity="info"
                sx={{ mb: 2 }}
                icon={<SecurityIcon fontSize="small" />}
              >
                Chỉ quản trị viên và moderator mới có thể truy cập trang này
              </Alert>
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 2,
              }}
            >
              <Input
                label="Email Admin"
                placeholder="admin@example.com"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
                startAdornment={<LockIcon sx={{ fontSize: 20, color: theme.palette.text.secondary, mr: 1 }} />}
              />
              <Input
                label="Mật khẩu"
                placeholder="••••••••"
                type="password"
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password')}
                startAdornment={<LockIcon sx={{ fontSize: 20, color: theme.palette.text.secondary, mr: 1 }} />}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel
                  control={<Checkbox size="small" color="primary" />}
                  label={<Typography variant="body2">Ghi nhớ đăng nhập</Typography>}
                />
                <Typography
                  component={Link}
                  to="/auth/forgot-password"
                  variant="body2"
                  color="primary.main"
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Quên mật khẩu?
                </Typography>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ 
                  mt: 1,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập Admin'}
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Divider sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  hoặc tiếp tục với
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              {googleClientId ? (
                <Box sx={{ width: '100%', '& > div': { width: '100% !important' }, '& iframe': { width: '100% !important' } }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    size="large"
                    shape="pill"
                    text="signin_with"
                    locale="vi"
                    width="100%"
                  />
                </Box>
              ) : (
                <Button
                  type="button"
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<GoogleIcon />}
                  disabled
                  sx={{ textTransform: 'none', borderColor: 'divider' }}
                >
                  Google chưa được cấu hình
                </Button>
              )}

              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Không phải là admin?{' '}
                  <Typography
                    component={Link}
                    to="/"
                    variant="body2"
                    color="primary.main"
                    fontWeight={600}
                    sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    Về trang chủ
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Page>
  );
};

export default AdminLoginPage;
