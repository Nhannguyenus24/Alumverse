import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { Box, Typography, Button } from '@mui/material';
import Page from '../components/Page';
import Input from '../components/Input';
import { changePasswordSchema } from '../schemas/authSchemas';
import { useAuth } from '../hooks/useAuth';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { resetPassword, isLoading: loading, error, setError } = useAuth();

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
    if (result?.ok) navigate('/dashboard', { replace: true });
  };

  return (
    <Page
      title="Đổi mật khẩu"
      meta={<meta name="description" content="Đặt lại mật khẩu" />}
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
          Đổi mật khẩu
        </Typography>

        {error && (
          <Typography variant="body2" color="error" textAlign="center">
            {error}
          </Typography>
        )}

        <Input
          label="Mật khẩu hiện tại"
          placeholder="••••••••"
          type="password"
          error={!!errors.oldPassword}
          helperText={errors.oldPassword?.message}
          {...register('oldPassword')}
        />
        <Input
          label="Mật khẩu mới"
          placeholder="••••••••"
          type="password"
          error={!!errors.newPassword}
          helperText={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Input
          label="Nhập lại mật khẩu mới"
          placeholder="••••••••"
          type="password"
          error={!!errors.confirmNewPassword}
          helperText={errors.confirmNewPassword?.message}
          {...register('confirmNewPassword')}
        />

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Nếu bạn không muốn đổi mật khẩu, bỏ qua trang này.
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
          {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          <Typography
            component={Link}
            to="/dashboard"
            variant="body2"
            color="primary.main"
            fontWeight={600}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Quay lại trang chủ
          </Typography>
        </Typography>
      </Box>
    </Page>
  );
};

export default ResetPasswordPage;
