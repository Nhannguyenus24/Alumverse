import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { useSnackbar } from 'notistack';
import { Box, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Page from '../../components/Page';
import Input from '../../components/Input';
import Dropdown from '../../components/Dropdown';
import { registerSchema } from '../../schemas/authSchemas';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate, useOrgPath } from '../../hooks/useOrgNavigate';
import useOrganizationStore from '../../stores/organizationStore';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: String(CURRENT_YEAR - i),
  label: String(CURRENT_YEAR - i),
}));

const RegisterPage = () => {
  const navigate = useOrgNavigate();
  const toOrgPath = useOrgPath();
  const { enqueueSnackbar } = useSnackbar();
  const { register: registerUser, forgotPassword, isLoading: loading, setError } = useAuth();
  const [passwordValue, setPasswordValue] = useState('');
  const organizationId = useOrganizationStore((state) => state.organization?.id);

  const passwordRequirements = {
    length: passwordValue.length >= 8,
    uppercase: /[A-Z]/.test(passwordValue),
    lowercase: /[a-z]/.test(passwordValue),
    digit: /\d/.test(passwordValue),
    special: /[@$!%*?&]/.test(passwordValue),
  };

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
      enqueueSnackbar('Đăng ký thành công. Vui lòng kiểm tra email để nhận mã xác thực.', {
        variant: 'success',
      });
      const fp = await forgotPassword({ email: data.email });
      if (!fp?.ok) {
        enqueueSnackbar(fp?.error ?? 'Không gửi được mã xác thực.', { variant: 'error' });
      }
      navigate('/auth/signup-code', { state: { email: data.email }, replace: true });
    } else if (result?.error) {
      enqueueSnackbar(result.error, { variant: 'error' });
    }
  };

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

        <Input
          label="Họ và tên"
          placeholder="Họ Và Tên"
          type="text"
          error={!!errors.fullName}
          helperText={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Mã số sinh viên"
          placeholder="Mã số sinh viên"
          type="text"
          error={!!errors.studentId}
          helperText={errors.studentId?.message}
          {...register('studentId')}
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
          {...register('password', {
            onChange: (e) => setPasswordValue(e.target.value),
          })}
        />

          <Box
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              Yêu cầu mật khẩu:
            </Typography>
            <PasswordRequirementItem label="Tối thiểu 8 ký tự" met={passwordRequirements.length} />
            <PasswordRequirementItem label="Ít nhất 1 chữ viết hoa (A-Z)" met={passwordRequirements.uppercase} />
            <PasswordRequirementItem label="Ít nhất 1 chữ viết thường (a-z)" met={passwordRequirements.lowercase} />
            <PasswordRequirementItem label="Ít nhất 1 chữ số (0-9)" met={passwordRequirements.digit} />
            <PasswordRequirementItem
              label="Ít nhất 1 ký tự đặc biệt (@$!%*?&)"
              met={passwordRequirements.special}
            />
          </Box>

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
            to={toOrgPath('/auth/login')}
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
