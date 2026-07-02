import { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Popper, Paper } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { useSnackbar } from 'notistack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Page from '../../components/Page';
import Input from '../../components/Input';
import Dropdown from '../../components/Dropdown';
import { getRegisterSchema } from '../../utils/regexUtils';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate, useOrgPath } from '../../hooks/useOrgNavigate';
import useOrganizationStore from '../../stores/organizationStore';
import { useTheme, useMediaQuery } from '@mui/material';

const PasswordRequirementItem = ({ label, met }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {met ? (
      <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
    ) : (
      <CancelIcon sx={{ fontSize: 18, color: 'error.main' }} />
    )}
    <Typography variant="caption" sx={{ color: met ? 'success.main' : 'error.main' }}>
      {label}
    </Typography>
  </Box>
);

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: String(CURRENT_YEAR - i),
  label: String(CURRENT_YEAR - i),
}));

const RegisterPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const { enqueueSnackbar } = useSnackbar();
  const { register: registerUser, forgotPassword, isSubmitting: loading, setError } = useAuth();
  const [passwordValue, setPasswordValue] = useState('');
  const organizationId = useOrganizationStore((state) => state.organization?.id);
  const [showRequirements, setShowRequirements] = useState(false);
  const passwordRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const passwordRequirements = {
    length: passwordValue.length >= 8,
    uppercase: /[A-Z]/.test(passwordValue),
    lowercase: /[a-z]/.test(passwordValue),
    digit: /\d/.test(passwordValue),
    special: /[@$!%*?&]/.test(passwordValue),
  };

  const registerSchema = useMemo(() => getRegisterSchema(t), [t]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      studentId: '',
      enrollmentYear: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setError(null);
    if (!organizationId) {
      enqueueSnackbar(t('auth:register_org_loading'), { variant: 'warning' });
      return;
    }
    const result = await registerUser({
      email: data.email,
      fullName: data.fullName,
      studentId: data.studentId,
      enrollmentYear: data.enrollmentYear,
      password: data.password,
      confirmPassword: data.confirmPassword,
      organizationId,
    });
    if (result?.ok) {
      enqueueSnackbar(t('auth:register_success'), {
        variant: 'success',
      });
      navigate('/auth/signup-code', { state: { email: data.email }, replace: true });
    } else if (result?.error) {
      enqueueSnackbar(result.error, { variant: 'error' });
    }
  };

  return (
    <Page
      title={t('auth:register_heading')}
      meta={<meta name="description" content={t('auth:register_heading')} />}
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
          {t('auth:register_heading')}
        </Typography>

        <Input
          label={t('auth:full_name_label')}
          placeholder={t('auth:full_name_placeholder')}
          type="text"
          error={!!errors.fullName}
          helperText={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label={t('auth:student_id_label')}
          placeholder={t('auth:student_id_placeholder')}
          type="text"
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 50 }}
          error={!!errors.studentId}
          helperText={errors.studentId?.message}
          {...register('studentId')}
          onInput={(e) => {
            // MSSV chỉ gồm chữ số.
            e.target.value = e.target.value.replace(/\D/g, '');
          }}
        />
        <Controller
          name="enrollmentYear"
          control={control}
          render={({ field }) => (
            <Dropdown
              label={t('auth:enrollment_year_label')}
              placeholder={t('auth:enrollment_year_placeholder')}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              options={YEAR_OPTIONS}
              error={!!errors.enrollmentYear}
              helperText={errors.enrollmentYear?.message}
            />
          )}
        />
        <Input
          label="Email"
          placeholder="email@example.com"
          type="email"
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email')}
        />
        <Box ref={passwordRef}>
          <Input
            label={t('auth:password_label')}
            placeholder="••••••••"
            type="password"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password', {
              onChange: (e) => setPasswordValue(e.target.value),
            })}
            onFocus={() => setShowRequirements(true)}
            onBlur={() => setShowRequirements(false)}
          />
          <Popper
            open={showRequirements}
            anchorEl={passwordRef.current}
            placement={isMobile ? 'bottom-start' : 'right-start'}
            sx={{ zIndex: 2000}}
          >
            <Paper
              elevation={4}
              sx={{
                p: 2,
                width: { xs: 'calc(100vw - 32px)', md: 260 },
                maxWidth: 320,
                ml: { md: 1 },
                mt: { xs: 1, md: 0 },
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={600}
                mb={1}
              >
                {t('auth:password_requirements_title')}
              </Typography>

              <PasswordRequirementItem
                label={t('auth:password_req_length')}
                met={passwordRequirements.length}
              />

              <PasswordRequirementItem
                label={t('auth:password_req_uppercase')}
                met={passwordRequirements.uppercase}
              />

              <PasswordRequirementItem
                label={t('auth:password_req_lowercase')}
                met={passwordRequirements.lowercase}
              />

              <PasswordRequirementItem
                label={t('auth:password_req_digit')}
                met={passwordRequirements.digit}
              />

              <PasswordRequirementItem
                label={t('auth:password_req_special')}
                met={passwordRequirements.special}
              />
            </Paper>
          </Popper>
        </Box>
        <Input
          label={t('auth:confirm_password_label')}
          placeholder="••••••••"
          type="password"
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          {...register('confirmPassword')}
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
          {loading ? t('auth:processing') : t('auth:continue')}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          {t('auth:have_account_prompt')}{' '}
          <Typography
            component={Link}
            to={toOrgPath('/auth/login')}
            variant="body2"
            color="primary.main"
            fontWeight={600}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {t('auth:login_now')}
          </Typography>
        </Typography>
      </Box>
    </Page>
  );
};

export default RegisterPage;