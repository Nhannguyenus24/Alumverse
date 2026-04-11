import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router';
import { Box, Typography, Button, FormControlLabel, Checkbox } from '@mui/material';
import { useState } from 'react';
import Page from '../../components/Page';
import Input from '../../components/Input';
import { loginSchema } from '../../schemas/authSchemas';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { getUserOrganizations, getOrganizationMembershipDetails } from '../../api/userApi';

const LoginPage = () => {
  const navigate = useOrgNavigate();
  const routerNavigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: loading, error, setError, forgotPassword } = useAuth();
  const [checkingOrg, setCheckingOrg] = useState(false);

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
      // After successful login, check if user has organizations
      setCheckingOrg(true);
      try {
        const orgsResponse = await getUserOrganizations();
        const organizations = orgsResponse?.data?.data || [];
        
        if (organizations.length === 0) {
          // User has no organization - redirect to org registration
          // Note: you may need to pass organizationId as query param
          // For now, redirecting to a page where user can select organization
          routerNavigate('/auth/organization-registration', { replace: true });
        } else {
          // User has at least one organization - redirect to dashboard
          // Get first organization details
          const firstOrg = organizations[0];
          const slug = firstOrg.organizationSlug || 'alumni';
          routerNavigate(`/${slug}/dashboard`, { replace: true });
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
        // Fall back to default redirect
        routerNavigate(redirectTo, { replace: true });
      } finally {
        setCheckingOrg(false);
      }
    } else if (result?.error && result.error.includes('Account is not verified')) {
      // Account chưa verified → gửi OTP rồi chuyển đến trang nhập mã
      await forgotPassword({ email: data.email });
      navigate('/auth/signup-code', { state: { email: data.email } });
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

        {error && (
          <Typography variant="body2" color="error" textAlign="center">
            {error}
          </Typography>
        )}

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
            onClick={(e) => {
              e.preventDefault();
              navigate('/auth/forgot-password');
            }}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline', cursor: 'pointer' } }}
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
          disabled={loading || checkingOrg}
          sx={{ mt: 1 }}
        >
          {loading || checkingOrg ? 'Đang xử lý...' : 'Đăng nhập'}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          Bạn chưa có tài khoản?{' '}
          <Typography
            component={Link}
            to="/auth/register"
            variant="body2"
            color="primary.main"
            fontWeight={600}
            onClick={(e) => {
              e.preventDefault();
              navigate('/auth/register');
            }}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline', cursor: 'pointer' } }}
          >
            Đăng ký ngay!
          </Typography>
        </Typography>
      </Box>
    </Page>
  );
};

export default LoginPage;
