import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'react-router';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Box, Typography, Button } from '@mui/material';
import Page from '../../components/Page';
import Input from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate, useOrgPath } from '../../hooks/useOrgNavigate';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

const ResetPasswordPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { resetPasswordWithOtp, isSubmitting: loading, setError } = useAuth();

  const email = location.state?.email ?? '';
  const otp = location.state?.otp ?? '';

  const schema = useMemo(() =>
    z.object({
      newPassword: z
        .string()
        .min(8, t('auth:new_password_length'))
        .max(100, t('auth:new_password_length'))
        .regex(PASSWORD_REGEX, t('auth:password_complexity')),
      confirmNewPassword: z.string().min(1, t('auth:confirm_new_password_required')),
    }).refine((d) => d.newPassword === d.confirmNewPassword, {
      message: t('auth:new_passwords_not_match'),
      path: ['confirmNewPassword'],
    }),
  [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmNewPassword: '' },
  });

  const onSubmit = async (data) => {
    if (!email || !otp) {
      enqueueSnackbar(t('auth:reset_password_invalid_session'), { variant: 'error' });
      navigate('/auth/forgot-password', { replace: true });
      return;
    }
    setError(null);
    const result = await resetPasswordWithOtp({ email, otp, newPassword: data.newPassword });
    if (result?.ok) {
      enqueueSnackbar(result.message ?? t('auth:reset_password_success'), { variant: 'success' });
      navigate('/auth/login', { replace: true });
    } else if (result?.error) {
      enqueueSnackbar(result.error, { variant: 'error' });
    }
  };

  return (
    <Page
      title={t('auth:reset_password_heading')}
      meta={<meta name="description" content={t('auth:reset_password_meta')} />}
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
          color="primary.dark"
          textAlign="center"
          sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
        >
          {t('auth:reset_password_heading')}
        </Typography>

        <Input
          label={t('auth:new_password_label')}
          placeholder="••••••••"
          type="password"
          error={!!errors.newPassword}
          helperText={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Input
          label={t('auth:confirm_new_password_label')}
          placeholder="••••••••"
          type="password"
          error={!!errors.confirmNewPassword}
          helperText={errors.confirmNewPassword?.message}
          {...register('confirmNewPassword')}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading}
          sx={{ mt: 1 }}
        >
          {loading ? t('auth:processing') : t('auth:reset_password_heading')}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          <Typography
            component={Link}
            to={toOrgPath('/auth/login')}
            variant="body2"
            color="primary.main"
            fontWeight={600}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {t('auth:back_to_login')}
          </Typography>
        </Typography>
      </Box>
    </Page>
  );
};

export default ResetPasswordPage;
