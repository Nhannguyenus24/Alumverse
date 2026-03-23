import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { Box, Typography, Button } from '@mui/material';
import Page from '../../components/Page';
import Input from '../../components/Input';
import Dropdown from '../../components/Dropdown';
import { registerSchema } from '../../schemas/authSchemas';
import { useAuth } from '../../hooks/useAuth';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: String(CURRENT_YEAR - i),
  label: String(CURRENT_YEAR - i),
}));

const STUDENT_ID_OPTIONS = [
  { value: 'msv1', label: 'Mã số 1' },
  { value: 'msv2', label: 'Mã số 2' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading: loading, error, setError } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userName: '',
      studentId: '',
      enrollmentYear: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setError(null);
    const result = await registerUser({
      email: data.email,
      userName: data.userName,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
    if (result?.ok) {
      navigate('/auth/signup-code', { state: { email: data.email }, replace: true });
    }
  };

  return (
    <Page
      title="Đăng ký"
      meta={<meta name="description" content="Đăng ký tài khoản mới" />}
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

        <Input
          label="Họ và tên"
          placeholder="Họ Và Tên"
          type="text"
          error={!!errors.userName}
          helperText={errors.userName?.message}
          {...register('userName')}
        />
        <Controller
          name="studentId"
          control={control}
          render={({ field }) => (
            <Dropdown
              label="Mã số sinh viên"
              placeholder="Mã số sinh viên"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              options={STUDENT_ID_OPTIONS}
              error={!!errors.studentId}
              helperText={errors.studentId?.message}
            />
          )}
        />
        <Controller
          name="enrollmentYear"
          control={control}
          render={({ field }) => (
            <Dropdown
              label="Năm nhập học"
              placeholder="Năm nhập học"
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
        <Input
          label="Mật khẩu"
          placeholder="••••••••"
          type="password"
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Nhập lại mật khẩu"
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
          {loading ? 'Đang xử lý...' : 'Tiếp tục'}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          Bạn đã có tài khoản?{' '}
          <Typography
            component={Link}
            to="/auth/login"
            variant="body2"
            color="primary.main"
            fontWeight={600}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Đăng nhập ngay!
          </Typography>
        </Typography>
      </Box>
    </Page>
  );
};

export default RegisterPage;
