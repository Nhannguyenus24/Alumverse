import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Typography, Button } from '@mui/material';
import Page from '../components/Page';
import Input from '../components/Input';
import { sendOtpSchema } from '../schemas/authSchemas';
import { useAuth } from '../hooks/useAuth';

const ForgotPasswordPage = () => {
  const { forgotPassword, isLoading: loading, error, setError } = useAuth();

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
    await forgotPassword({ email: data.email });
  };

  return (
    <Page
      title="Quên mật khẩu"
      meta={<meta name="description" content="Khôi phục mật khẩu" />}
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
          Quên mật khẩu
        </Typography>

        {error && (
          <Typography variant="body2" color="error" textAlign="center">
            {error}
          </Typography>
        )}

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
          Mã phục hồi tài khoản sẽ được gửi qua email đăng ký.
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
          {loading ? 'Đang gửi...' : 'Gửi mã'}
        </Button>
      </Box>
    </Page>
  );
};

export default ForgotPasswordPage;
