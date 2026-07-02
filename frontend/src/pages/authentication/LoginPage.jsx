import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { GoogleReCaptchaCheckbox, useGoogleReCaptcha } from '@google-recaptcha/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useParams } from 'react-router';
import { useSnackbar } from 'notistack';
import { GoogleLogin } from '@react-oauth/google';
import { Alert, Box, Typography, Button, FormControlLabel, Checkbox, Divider, useTheme } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useTranslation } from 'react-i18next';
import Page from '../../components/Page';
import Input from '../../components/Input';
import { getLoginSchema } from '../../utils/regexUtils';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate, useOrgPath } from '../../hooks/useOrgNavigate';
import useOrganizationStore from '../../stores/organizationStore';

const LoginPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const theme = useTheme();
  const navigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const { slug } = useParams();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { login, loginWithGoogle, isSubmitting: loading, setError, forgotPassword } = useAuth();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const organizationId = useOrganizationStore((state) => state.organization?.id);
  const { reset } = useGoogleReCaptcha();

  const searchParams = new URLSearchParams(location.search);
  const reason = searchParams.get('reason');
  const redirectTo = searchParams.get('from') || location.state?.from?.pathname || '/';
  const wasRedirectedForAuth = Boolean(location.state?.from) || reason === 'login_required';
  const thirdPartyControlSx = theme.palette.mode === 'dark'
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
    getValues,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false, recaptchaToken: '' },
  });

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
      enqueueSnackbar(t('auth:login_success'), { variant: 'success' });

      if (result?.data?.verificationLevel === 0) {
        navigate(`/${slug}/organization-registration`, {
          replace: true,
          state: { redirectTo },
        });
        return;
      }

      if (result?.data?.user?.role === 'STAFF') {
        navigate(`/${slug}/admin`, { replace: true });
        return;
      }

      if (result?.data?.user?.role === 'ADMIN') {
        navigate(`/admin`, { replace: true });
        return;
      }

      navigate(redirectTo, { replace: true });
    } else {
      if (reset) {
        reset();
      }
      setValue('recaptchaToken', '');

      if (result?.error && result.error.includes('Account is not verified')) {
        const fp = await forgotPassword({ email: data.email });
        if (!fp?.ok) {
          enqueueSnackbar(fp?.error ?? t('auth:login_unverified_code_failed'), { variant: 'error' });
          return;
        }
        enqueueSnackbar(t('auth:login_unverified_code_sent'), { variant: 'success' });
        navigate('/auth/signup-code', { state: { email: data.email } });
      } else if (result?.error) {
        enqueueSnackbar(result.error, { variant: 'error' });
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      enqueueSnackbar(t('auth:login_google_token_error'), { variant: 'error' });
      return;
    }

    setError(null);
    const result = await loginWithGoogle(idToken, getValues('rememberMe'));
    if (result?.ok) {
      enqueueSnackbar(t('auth:login_google_success'), { variant: 'success' });

      if (result?.data?.verificationLevel === 0) {
        navigate(`/${slug}/organization-registration`, {
          replace: true,
          state: { redirectTo },
        });
        return;
      }

      if (result?.data?.user?.role === 'STAFF') {
        navigate(`/${slug}/admin`, { replace: true });
        return;
      }

      navigate(redirectTo, { replace: true });
      return;
    }

    enqueueSnackbar(result?.error ?? t('auth:login_google_failed'), { variant: 'error' });
  };

  const handleGoogleError = () => {
    enqueueSnackbar(t('auth:login_google_failed'), { variant: 'error' });
  };

  return (
    <Page
      title={t('auth:login_heading')}
      meta={<meta name="description" content={t('auth:login_heading')} />}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          color="primary.main"
          textAlign="center"
          sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
        >
          {t('auth:login_heading')}
        </Typography>

        {wasRedirectedForAuth && (
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            {t('auth:login_required_redirect_message')}
          </Alert>
        )}

        <Input
          label="Email"
          placeholder="email@example.com"
          // type="email"
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email')}
        />
        <Input
          label={t('auth:password_label')}
          placeholder="••••••••"
          type="password"
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register('password')}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <FormControlLabel
            control={<Checkbox size="small" color="primary" {...register('rememberMe')} />}
            label={<Typography variant="body2">{t('auth:remember_me')}</Typography>}
          />
          <Typography
            component={Link}
            to={toOrgPath('/auth/forgot-password')}
            variant="body2"
            color="primary.main"
            sx={{ textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
          >
            {t('auth:forgot_password_link')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', ...thirdPartyControlSx }}>
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
          color="primary"
          fullWidth
          size="large"
          disabled={loading}
          sx={{ mt: 1 }}
        >
          {loading ? t('auth:processing') : t('auth:login_heading')}
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Divider sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {t('auth:or_continue_with')}
          </Typography>
          <Divider sx={{ flex: 1 }} />
        </Box>

        {googleClientId ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            ...thirdPartyControlSx,
            '& > div': { width: '100% !important' },
            '& iframe': { width: '100% !important' },
          }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              size="large"
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
            {t('auth:login_google_not_configured')}
          </Button>
        )}

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          {t('auth:no_account_prompt')}{' '}
          <Typography
            component={Link}
            to={toOrgPath('/auth/register')}
            variant="body2"
            color="primary.main"
            fontWeight={600}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {t('auth:register_now')}
          </Typography>
        </Typography>
      </Box>
    </Page>
  );
};

export default LoginPage;
