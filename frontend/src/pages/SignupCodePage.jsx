import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router';
import { Box, Typography, Button } from '@mui/material';
import Page from '../components/Page';
import Input from '../components/Input';
import { verifyOtpSchema } from '../schemas/authSchemas';
import { useAuth } from '../hooks/useAuth';

const SignupCodePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifySignupCode, forgotPassword, isLoading: loading, error, setError } = useAuth();
  const emailFromState = location.state?.email ?? '';

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: emailFromState, otp: '' },
  });

  const onSubmit = async (data) => {
    setError(null);
    const result = await verifySignupCode({ email: data.email, otp: data.otp });
    if (result?.ok) navigate('/auth/login', { replace: true });
  };

  const handleResend = async () => {
    setError(null);
    const email = getValues('email');
    if (email) await forgotPassword({ email });
  };

  return (
    <Page
      title="Đăng ký"
      meta={<meta name="description" content="Nhập mã đăng ký" />}
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
          Đăng ký
        </Typography>

        {error && (
          <Typography variant="body2" color="error" textAlign="center">
            {error}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Mã đăng ký đã được gửi đến email của bạn.
        </Typography>

        <Input
          label="Mã đăng ký"
          placeholder="385028"
          type="text"
          inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
          error={!!errors.otp}
          helperText={errors.otp?.message}
          {...register('otp')}
        />

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Chưa nhận được mã?{' '}
          <Typography
            component="button"
            type="button"
            variant="body2"
            color="primary.main"
            onClick={handleResend}
            disabled={loading}
            sx={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              font: 'inherit',
              fontWeight: 600,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Gửi lại mã.
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
            to="/auth/login"
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
