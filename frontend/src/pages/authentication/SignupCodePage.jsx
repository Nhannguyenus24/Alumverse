import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'react-router';
import { useSnackbar } from 'notistack';
import { Box, Typography, Button, TextField } from '@mui/material';
import Page from '../../components/Page';
import { verifyOtpSchema } from '../../schemas/authSchemas';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate, useOrgPath } from '../../hooks/useOrgNavigate';

const SignupCodePage = () => {
  const location = useLocation();
  const navigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const { enqueueSnackbar } = useSnackbar();
  const { verifySignupCode, forgotPassword, isLoading: loading, setError } = useAuth();
  const emailFromState = location.state?.email ?? '';
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
    formState: { errors },
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
    const result = await verifySignupCode({ email: data.email, otp: data.otp });
    if (result?.ok) {
      enqueueSnackbar(result.message ?? 'Xác thực thành công. Bạn có thể đăng nhập.', { variant: 'success' });
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
      enqueueSnackbar('Vui lòng nhập email.', { variant: 'warning' });
      return;
    }
    const fp = await forgotPassword({ email });
    if (fp?.ok) {
      enqueueSnackbar(fp.message ?? 'Đã gửi lại mã đến email của bạn.', { variant: 'success' });
      setCountdown(60);
    } else if (fp?.error) {
      enqueueSnackbar(fp.error, { variant: 'error' });
    }
  };

  return (
    <Page
      title="Đăng ký"
      meta={<meta name="description" content="Nhập mã đăng ký" />}
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
          Đăng ký
        </Typography>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Mã đăng ký đã được gửi đến email của bạn.
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
          Chưa nhận được mã?{' '}
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
            {countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã.'}
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
          {loading ? 'Đang xử lý...' : 'Tiếp tục'}
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
            Quay lại đăng nhập
          </Typography>
        </Typography>
      </Box>
    </Page>
  );
};

export default SignupCodePage;
