import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'react-router';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, TextField } from '@mui/material';
import Page from '../../components/Page';
import { verifyOtpSchema } from '../../utils/regexUtils';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate, useOrgPath } from '../../hooks/useOrgNavigate';

const SignupCodePage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const location = useLocation();
  const navigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const { enqueueSnackbar } = useSnackbar();
  const { verifySignupCode, forgotPassword, isSubmitting: loading, setError } = useAuth();
  const emailFromState = location.state?.email ?? '';
  const isForgotPasswordMode = location.state?.mode === 'forgot-password';
  const [countdown, setCountdown] = useState(60);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
  const otpInputRefs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
  } = useForm({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: emailFromState, otp: '' },
  });

  useEffect(() => {
    setValue('otp', otpDigits.join(''), { shouldValidate: true, shouldDirty: true });
  }, [otpDigits, setValue]);

  const focusOtpInput = (index) => {
    if (index >= 0 && index < otpInputRefs.current.length) {
      otpInputRefs.current[index]?.focus();
    }
  };

  const handleOtpChange = (index, rawValue) => {
    const digitsOnly = rawValue.replace(/\D/g, '');

    if (!digitsOnly) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    setOtpDigits((prev) => {
      const next = [...prev];
      if (digitsOnly.length === 1) {
        next[index] = digitsOnly;
      } else {
        for (let i = 0; i < digitsOnly.length && index + i < 6; i += 1) {
          next[index + i] = digitsOnly[i];
        }
      }
      return next;
    });

    focusOtpInput(Math.min(index + digitsOnly.length, 5));
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key !== 'Backspace') return;

    if (otpDigits[index]) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    if (index > 0) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index - 1] = '';
        return next;
      });
      focusOtpInput(index - 1);
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedDigits) return;

    const next = Array(6).fill('');
    pastedDigits.split('').forEach((digit, idx) => {
      next[idx] = digit;
    });
    setOtpDigits(next);
    focusOtpInput(Math.min(pastedDigits.length - 1, 5));
  };

  const onSubmit = async (data) => {
    setError(null);
    if (isForgotPasswordMode) {
      navigate('/auth/reset-password', { state: { email: data.email, otp: data.otp } });
      return;
    }
    const result = await verifySignupCode({ email: data.email, otp: data.otp });
    if (result?.ok) {
      enqueueSnackbar(result.message ?? t('auth:verify_success'), { variant: 'success' });
      navigate('/auth/login', { replace: true });
    } else if (result?.error) {
      enqueueSnackbar(result.error, { variant: 'error' });
    }
  };

  const onInvalid = (formErrors) => {
    const otpErrorMessage = formErrors?.otp?.message;
    if (otpErrorMessage) {
      enqueueSnackbar(otpErrorMessage, { variant: 'error' });
    }
  };

  const handleResend = async () => {
    setError(null);
    const email = getValues('email');
    if (!email) {
      enqueueSnackbar(t('auth:enter_email_first'), { variant: 'warning' });
      return;
    }
    const fp = await forgotPassword({ email });
    if (fp?.ok) {
      enqueueSnackbar(fp.message ?? t('auth:resend_success'), { variant: 'success' });
      setCountdown(60);
    } else if (fp?.error) {
      enqueueSnackbar(fp.error, { variant: 'error' });
    }
  };

  return (
    <Page
      title={t('auth:signup_code_heading')}
      meta={<meta name="description" content={t('auth:signup_code_heading')} />}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit, onInvalid)}
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
          {t('auth:signup_code_heading')}
        </Typography>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('auth:signup_code_hint')}
        </Typography>

        <input type="hidden" {...register('otp')} />
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.2 }}>
          {otpDigits.map((digit, index) => (
            <TextField
              key={index}
              value={digit}
              onChange={(event) => handleOtpChange(index, event.target.value)}
              onKeyDown={(event) => handleOtpKeyDown(index, event)}
              onPaste={handleOtpPaste}
              inputRef={(el) => {
                otpInputRefs.current[index] = el;
              }}
              inputProps={{
                maxLength: 1,
                inputMode: 'numeric',
                pattern: '[0-9]*',
                style: { textAlign: 'center', fontSize: '1.2rem', fontWeight: 600 },
                'aria-label': `otp-digit-${index + 1}`,
              }}
              sx={{ width: { xs: 42, sm: 48 } }}
            />
          ))}
        </Box>

        <Typography variant="body2" color="text.main" textAlign="center">
          {t('auth:otp_not_received')}{' '}
          <Typography
            component="button"
            type="button"
            variant="body2"
            color="primary.main"
            onClick={handleResend}
            disabled={loading || countdown > 0}
            sx={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: countdown > 0 ? 'not-allowed' : 'pointer',
              font: 'inherit',
              fontWeight: 600,
              '&:hover': { textDecoration: countdown > 0 ? 'none' : 'underline' },
            }}
          >
            {countdown > 0 ? t('auth:resend_code_countdown', { count: countdown }) : t('auth:resend_code')}
          </Typography>
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
          {loading ? t('auth:processing') : t('auth:continue')}
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

export default SignupCodePage;
