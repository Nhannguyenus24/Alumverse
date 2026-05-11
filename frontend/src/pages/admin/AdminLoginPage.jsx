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
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        {/* Left Side: Login Form */}
        <Box
          sx={{
            flex: { xs: '1 1 auto', md: '0 0 50%' },
            width: { xs: '100%', md: '50%' },
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {/* Logo at Top Left */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              pt: { xs: 2, sm: 3 },
              pl: { xs: 2, sm: 3 },
              zIndex: 1,
            }}
          >
            <Box
              component={Link}
              to="/"
              sx={{ display: 'block', textDecoration: 'none' }}
            >
              <Box
                component="img"
                src="/alumverse_logo/Logo_Main_Full.svg"
                alt="ALUMVERSE HCMUS"
                sx={{ height: { xs: 40, sm: 50, md: 60 }, width: 'auto' }}
              />
            </Box>
          </Box>

          {/* Form Content */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              px: { xs: 2, sm: 4, md: 6 },
              pt: { xs: 12, md: 0 },
              pb: 4,
            }}
          >
            <Box sx={{ maxWidth: 420, width: '100%' }}>
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    mb: 2,
                  }}
                >
                  <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                  Admin Login
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hệ thống quản trị HCMUS Alumni
                </Typography>
              </Box>

              <Alert
                severity="info"
                icon={<SecurityIcon fontSize="small" />}
                sx={{ mb: 3, borderRadius: 2, fontSize: '0.85rem' }}
              >
                Chỉ dành cho Quản trị viên và Điều phối viên.
              </Alert>

              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
              >
                <Input
                  label="Email Admin"
                  placeholder="admin@example.com"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  label="Mật khẩu"
                  placeholder="••••••••"
                  type="password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  {...register('password')}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label={<Typography variant="body2">Ghi nhớ</Typography>}
                  />
                  <Typography
                    component={Link}
                    to="/auth/forgot-password"
                    variant="body2"
                    color="primary.main"
                    sx={{ textDecoration: 'none', fontWeight: 600 }}
                  >
                    Quên mật khẩu?
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
                    boxShadow: (theme) => theme.customShadows?.primary,
                  }}
                >
                  {loading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'}
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                  <Divider sx={{ flex: 1 }} />
                  <Typography variant="caption" color="text.secondary">hoặc</Typography>
                  <Divider sx={{ flex: 1 }} />
                </Box>

                <Box sx={{ width: '100%', '& > div': { width: '100% !important' }, '& iframe': { width: '100% !important' } }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    locale="vi"
                    width="100%"
                  />
                </Box>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Bạn không có quyền quản trị?{' '}
                    <Typography
                      component={Link}
                      to="/"
                      variant="body2"
                      color="primary.main"
                      fontWeight={700}
                      sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Quay lại Trang chủ
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Right Side: Image */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            flex: '0 0 50%',
            width: '50%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'url(/auth_school.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'transform 0.5s ease',
              '&:hover': { transform: 'scale(1.02)' },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: alpha(theme.palette.primary.dark, 0.4),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: 8,
              color: 'common.white',
            }}
          >
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
              Quản trị Hệ thống <br /> HCMUS Alumni
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9, maxWidth: 480 }}>
              Chào mừng bạn trở lại. Hãy đăng nhập để quản lý cộng đồng cựu sinh viên và các hoạt động của trường.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

export default AdminLoginPage;
