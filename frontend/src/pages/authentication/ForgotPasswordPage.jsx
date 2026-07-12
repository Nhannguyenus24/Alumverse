import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { sendOtpSchema } from '../../utils/regexUtils';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const ForgotPasswordPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { forgotPassword, isSubmitting: loading, setError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sendOtpSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setError(null);
    const result = await forgotPassword({ email: data.email });
    if (result?.ok) {
      enqueueSnackbar(result.message ?? t('auth:code_sent'), { variant: 'success' });
      navigate('/auth/signup-code', { state: { email: data.email, mode: 'forgot-password' } });
    } else if (result?.error) {
      enqueueSnackbar(result.error, { variant: 'error' });
    }
  };

  return (
    <Page
      title={t('auth:forgot_password_heading')}
      meta={<meta name="description" content={t('auth:forgot_password_meta')} />}
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
        <ScrollRevealFields>
        <Typography
          variant="h5"
          fontWeight={700}
          color="primary.dark"
          textAlign="center"
          sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
        >
          {t('auth:forgot_password_heading')}
        </Typography>

        <Input
          label="Email"
          placeholder="email@example.com"
          type="email"
          autoComplete="email"
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email')}
        />

        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('auth:forgot_password_hint')}
        </Typography>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading}
          sx={{ mt: 1 }}
        >
          {loading ? t('auth:sending') : t('auth:send_code')}
        </Button>
        </ScrollRevealFields>
      </Box>
    </Page>
  );
};

export default ForgotPasswordPage;
