import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router';
import { useSnackbar } from 'notistack';
import { Box, Typography, Button, FormControlLabel, Checkbox } from '@mui/material';
import Page from '../../components/Page';
import Input from '../../components/Input';
import { loginSchema } from '../../schemas/authSchemas';
import { useAuth } from '../../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { login, isLoading: loading, setError, forgotPassword } = useAuth();

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setError(null);
    const result = await login({ email: data.email, password: data.password });
    if (result?.ok) {
      enqueueSnackbar('Đăng nhập thành công.', { variant: 'success' });
      navigate(redirectTo, { replace: true });
    } else if (result?.error && result.error.includes('Account is not verified')) {
      const fp = await forgotPassword({ email: data.email });
      if (!fp?.ok) {
        enqueueSnackbar(fp?.error ?? 'Gửi mã xác thực thất bại.', { variant: 'error' });
        return;
      }
      enqueueSnackbar('Mã xác thực đã được gửi đến email của bạn.', { variant: 'success' });
      navigate('/auth/signup-code', { state: { email: data.email } });
    } else if (result?.error) {
      enqueueSnackbar(result.error, { variant: 'error' });
    }
  };

  return (
    <Page
      title="Đăng nhập"
      meta={<meta name="description" content="Đăng nhập vào hệ thống" />}
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
          Đăng nhập
        </Typography>

        <Input
          label="Email"
          placeholder="email@example.com"
          type="email"
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Mật khẩu"
          placeholder="••••••••"
          type="password"
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register('password')}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <FormControlLabel
            control={<Checkbox size="small" color="primary" />}
            label={<Typography variant="body2">Ghi nhớ đăng nhập</Typography>}
          />
          <Typography
            component={Link}
            to="/auth/forgot-password"
            variant="body2"
            color="primary.main"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Quên mật khẩu?
          </Typography>
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
          {loading ? 'Đang xử lý...' : 'Đăng nhập'}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          Bạn chưa có tài khoản?{' '}
          <Typography
            component={Link}
            to="/auth/register"
            variant="body2"
            color="primary.main"
            fontWeight={600}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Đăng ký ngay!
          </Typography>
        </Typography>
      </Box>
    </Page>
  );
};

export default LoginPage;
