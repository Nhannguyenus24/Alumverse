import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Typography, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Page from '../../components/Page';
import { ScrollRevealFields } from '../../components/animations/ScrollReveal';
import Input from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { getChangePasswordSchema } from '../../utils/regexUtils';

const ForceChangePasswordPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const orgNavigate = useOrgNavigate();
  const routerNavigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { resetPassword, isSubmitting: loading, setError, user } = useAuth();
  const isGlobalAdmin = user?.role === 'ADMIN' && !user?.organizationId;

  const schema = useMemo(() => getChangePasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { oldPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onSubmit = async (data) => {
    setError(null);
    const result = await resetPassword({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
    if (result?.ok) {
      enqueueSnackbar(result.message ?? t('auth:reset_password_success'), { variant: 'success' });
      if (isGlobalAdmin) {
        routerNavigate('/admin', { replace: true });
      } else {
        orgNavigate('/', { replace: true });
      }
    } else if (result?.error) {
      enqueueSnackbar(result.error, { variant: 'error' });
    }
  };

  return (
    <Page
      title={t('auth:force_change_password_heading')}
      meta={<meta name="description" content={t('auth:force_change_password_meta')} />}
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
          color="primary.main"
          textAlign="center"
          sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
        >
          {t('auth:force_change_password_heading')}
        </Typography>

        <Alert
          severity="info"
          sx={(theme) => ({
            borderRadius: 1,
            color: 'primary.main',
            borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.34 : 0.22),
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
            '& .MuiAlert-icon': { color: 'primary.main' },
          })}
        >
          {t('auth:force_change_password_desc')}
        </Alert>

        <Input
          label={t('auth:current_password_label')}
          placeholder="••••••••"
          type="password"
          autoComplete="current-password"
          error={!!errors.oldPassword}
          helperText={errors.oldPassword?.message}
          {...register('oldPassword')}
        />
        <Input
          label={t('auth:new_password_label')}
          placeholder="••••••••"
          type="password"
          autoComplete="new-password"
          error={!!errors.newPassword}
          helperText={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Input
          label={t('auth:confirm_new_password_label')}
          placeholder="••••••••"
          type="password"
          autoComplete="new-password"
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
          {loading ? t('auth:processing') : t('auth:force_change_password_heading')}
        </Button>
        </ScrollRevealFields>
      </Box>
    </Page>
  );
};

export default ForceChangePasswordPage;
