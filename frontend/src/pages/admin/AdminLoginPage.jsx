import { useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { GoogleReCaptchaCheckbox, useGoogleReCaptcha } from '@google-recaptcha/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, Navigate } from 'react-router';
import { useSnackbar } from 'notistack';
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
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import Page from '../../components/Page';
import Input from '../../components/Input';
import { getLoginSchema } from '../../utils/regexUtils';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import useOrganizationStore from '../../stores/organizationStore';

const AdminLoginPage = () => {
  const { t } = useTranslation(['admin', 'auth']);
  const theme = useTheme();
  const navigate = useOrgNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { login, isSubmitting: loading, setError, forgotPassword, isAuthenticated } = useAuth();
  const organizationId = useOrganizationStore((state) => state.organization?.id);
  const { reset } = useGoogleReCaptcha();

  const redirectTo = location.state?.from?.pathname || '/admin';
  const logoSrc = theme.palette.mode === 'dark'
    ? '/alumverse_logo/Logo_White_Full.svg'
    : '/alumverse_logo/Logo_Main_Full.svg';
  const recaptchaSx = theme.palette.mode === 'dark'
    ? {
        filter: 'invert(0.9) hue-rotate(180deg)',
        borderRadius: 1,
        overflow: 'hidden',
      }
    : undefined;

  const loginSchema = useMemo(() => getLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false, recaptchaToken: '' },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleRecaptchaChange = useCallback((token) => {
    setValue('recaptchaToken', token);
    if (token) clearErrors('recaptchaToken');
  }, [setValue, clearErrors]);

  const handleRecaptchaExpired = useCallback(() => {
    setValue('recaptchaToken', '');
  }, [setValue]);

  const handleRecaptchaError = useCallback(() => {
    setValue('recaptchaToken', '');
  }, [setValue]);

  const onSubmit = async (data) => {
    setError(null);
    const result = await login({
      email: data.email,
      password: data.password,
      organizationId,
      rememberMe: data.rememberMe,
      recaptchaToken: data.recaptchaToken
    });
    if (result?.ok) {
      enqueueSnackbar(t('admin_login_success'), { variant: 'success' });

      // Check if user has admin role
      if (result?.data?.user?.role === 'ADMIN' || result?.data?.user?.role === 'MODERATOR') {
        navigate(redirectTo, { replace: true });
      } else {
        enqueueSnackbar(t('admin_login_no_permission'), { variant: 'error' });
        // Redirect to regular login or home page
        navigate('/', { replace: true });
      }
    } else {
      if (reset) {
        reset();
      }
      setValue('recaptchaToken', '');

      if (result?.error && result.error.includes('Account is not verified')) {
        const fp = await forgotPassword({ email: data.email });
        if (!fp?.ok) {
          enqueueSnackbar(fp?.error ?? t('admin_login_send_code_failed'), { variant: 'error' });
          return;
        }
        enqueueSnackbar(t('admin_login_code_sent'), { variant: 'success' });
        navigate('/auth/signup-code', { state: { email: data.email } });
      } else if (result?.error) {
        enqueueSnackbar(result.error, { variant: 'error' });
      }
    }
  };

  return (
    <Page
      title="Admin Login"
      meta={<meta name="description" content={t('admin_login_meta_desc')} />}
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
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: { xs: 1.5, sm: 2 },
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
                src={logoSrc}
                alt="ALUMVERSE HCMUS"
                sx={{ height: 40, width: 'auto' }}
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
                    color: 'primary.main',
                  }}
                >
                  <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography variant="h3" fontWeight={700} color="primary.main" textAlign="center">
                  Admin Login
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin_login_subtitle')}
                </Typography>
              </Box>

              <Alert
                severity="info"
                icon={<SecurityIcon fontSize="small" />}
                sx={{ mb: 3, borderRadius: 2, fontSize: '0.85rem' }}
              >
                {t('admin_login_alert')}
              </Alert>

              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
              >
                <Input
                  label={t('admin_login_email_label')}
                  placeholder="admin@example.com"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  label={t('admin_login_password_label')}
                  placeholder="••••••••"
                  type="password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  {...register('password')}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={<Checkbox size="small" {...register('rememberMe')} />}
                    label={<Typography variant="body2">{t('admin_login_remember_me')}</Typography>}
                  />
                  <Typography
                    component={Link}
                    to="/auth/forgot-password"
                    variant="body2"
                    color="primary.main"
                    sx={{
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {t('admin_login_forgot_password')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', ...recaptchaSx }}>
                  <GoogleReCaptchaCheckbox
                    onChange={handleRecaptchaChange}
                    onExpired={handleRecaptchaExpired}
                    onError={handleRecaptchaError}
                  />
                  </Box>
                  {errors.recaptchaToken && (
                    <Typography variant="caption" color="error" align="center" sx={{ width: '100%' }}>
                      {errors.recaptchaToken.message}
                    </Typography>
                  )}
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                >
                  {loading ? t('admin_login_loading') : t('admin_login_submit')}
                </Button>

                <Box sx={{ mt: 1.5, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin_login_no_admin_question')}{' '}
                    <Typography
                      component={Link}
                      to="/"
                      variant="body2"
                      color="primary.main"
                      fontWeight={600}
                      sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {t('admin_login_back_home')}
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
              bgcolor: alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.68 : 0.42),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: 8,
              color: 'common.white',
            }}
          >
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
              {t('admin_login_hero_title')}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9, maxWidth: 480 }}>
              {t('admin_login_hero_subtitle')}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

export default AdminLoginPage;
