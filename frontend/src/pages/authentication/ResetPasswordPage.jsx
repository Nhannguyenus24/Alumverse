import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button } from '@mui/material';
import Page from '../../components/Page';
import Input from '../../components/Input';
import { getChangePasswordSchema } from '../../utils/regexUtils';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate, useOrgPath } from '../../hooks/useOrgNavigate';

const ResetPasswordPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const { enqueueSnackbar } = useSnackbar();
  const { resetPassword, isSubmitting: loading, setError } = useAuth();

  const changePasswordSchema = useMemo(() => getChangePasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onSubmit = async (data) => {
    setError(null);
    const result = await resetPassword({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
      confirmNewPassword: data.confirmNewPassword,
    });
    if (result?.ok) {
      enqueueSnackbar(result.message ?? t('auth:reset_password_success'), { variant: 'success' });
      navigate('/dashboard', { replace: true });
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
          label={t('auth:current_password_label')}
          placeholder="••••••••"
          type="password"
          error={!!errors.oldPassword}
          helperText={errors.oldPassword?.message}
          {...register('oldPassword')}
        />
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

        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('auth:reset_password_skip_hint')}
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
          {loading ? t('auth:processing') : t('auth:reset_password_heading')}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          <Typography
            component={Link}
            to={toOrgPath('/dashboard')}
            variant="body2"
            color="primary.main"
            fontWeight={600}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {t('auth:back_to_home')}
          </Typography>
        </Typography>
      </Box>
    </Page>
  );
};

export default ResetPasswordPage;
