import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import Page from '../../components/Page';
import Input from '../../components/Input';
import { joinOrganization } from '../../api/userApi';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useOrganization } from '../../hooks/useOrganization';
import { z } from 'zod';

/**
 * Validation schema for organization registration
 */
const organizationRegistrationSchema = z.object({
  organizationId: z.number().positive('Organization ID must be provided').int(),
  studentCode: z.string().optional().or(z.literal('')),
  className: z.string().optional().or(z.literal('')),
  startYear: z.number().positive('Start year must be positive').int().optional().or(z.literal('')),
  graduatedYear: z.number().positive('Graduated year must be positive').int().optional().or(z.literal('')),
  degreeType: z.string().optional().or(z.literal('')),
});

/**
 * Organization Registration Page
 * Allows users to register/join an organization with academic information
 */
const OrganizationRegistrationPage = () => {
  const navigate = useOrgNavigate();
  const routerNavigate = useNavigate();
  const { organization, loading: organizationLoading } = useOrganization();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [proofFile, setProofFile] = useState(null);

  // Prefer organization ID from context (resolved by slug), keep query param as fallback.
  const queryOrgId = searchParams.get('orgId');
  const parsedQueryOrgId = queryOrgId ? parseInt(queryOrgId, 10) : null;
  const organizationId = organization?.id ?? (Number.isInteger(parsedQueryOrgId) ? parsedQueryOrgId : null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(organizationRegistrationSchema),
    defaultValues: {
      organizationId: organizationId ?? undefined,
      studentCode: '',
      className: '',
      startYear: undefined,
      graduatedYear: undefined,
      degreeType: '',
    },
  });

  useEffect(() => {
    if (organizationId) {
      setValue('organizationId', organizationId);
      setError(null);
    } else if (!organizationLoading) {
      setError('Organization ID is required. Please provide a valid organization.');
    }
  }, [organizationId, organizationLoading, setValue]);

  const handleProofFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ hỗ trợ file PDF, JPG hoặc PNG cho minh chứng.');
      return;
    }

    if (file.size > maxSizeBytes) {
      setError('File minh chứng vượt quá 5MB. Vui lòng chọn file nhỏ hơn.');
      return;
    }

    setError(null);
    setProofFile(file);
  };

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);

    try {
      // Convert empty strings to undefined for optional fields
      const payload = {
        organizationId: data.organizationId,
        ...(data.studentCode && { studentCode: data.studentCode }),
        ...(data.className && { className: data.className }),
        ...(data.startYear && { startYear: data.startYear }),
        ...(data.graduatedYear && { graduatedYear: data.graduatedYear }),
        ...(data.degreeType && { degreeType: data.degreeType }),
      };

      const response = await joinOrganization(payload);

      if (response?.data) {
        // Successfully joined organization
        const orgSlug = response.data?.data?.organizationSlug || 'alumni';
        
        // Redirect to dashboard with slug
        routerNavigate(`/${orgSlug}/dashboard`, { replace: true });
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message 
        || err?.message 
        || 'Failed to register to organization. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!organizationId && !organizationLoading) {
    return (
      <Page
        title="Organization Registration"
        meta={<meta name="description" content="Register to organization" />}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 2,
          }}
        >
          <Typography variant="h6" color="error">
            Invalid Organization
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Please provide a valid organization to register.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/auth/login', { replace: true })}
          >
            Back to Login
          </Button>
        </Box>
      </Page>
    );
  }

  return (
    <Page
      title="Organization Registration"
      meta={<meta name="description" content="Register to organization" />}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          width: '100%',
          maxWidth: '500px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: { xs: 1.5, sm: 2 },
          padding: { xs: 2, sm: 3 },
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          color="primary.dark"
          textAlign="center"
          sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 1 }}
        >
          Organization Registration
        </Typography>

        <Typography
          variant="body2"
          color="textSecondary"
          textAlign="center"
          sx={{ mb: 2 }}
        >
          Please provide your academic information to register with the organization.
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Required Fields */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} color="primary.main" sx={{ mb: 1 }}>
            Required Information
          </Typography>
        </Box>

        {/* Organization ID (hidden field) */}
        <input
          type="hidden"
          {...register('organizationId', { valueAsNumber: true })}
        />

        <Input
          label="Student Code"
          placeholder="e.g., 123456"
          error={!!errors.studentCode}
          helperText={errors.studentCode?.message}
          {...register('studentCode')}
        />

        {/* Optional Fields */}
        <Box sx={{ mb: 1, mt: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} color="textSecondary" sx={{ mb: 1 }}>
            Academic Information (Optional)
          </Typography>
        </Box>

        <Input
          label="Class Name"
          placeholder="e.g., K15"
          error={!!errors.className}
          helperText={errors.className?.message}
          {...register('className')}
        />

        <Input
          label="Start Year"
          type="number"
          placeholder="e.g., 2015"
          error={!!errors.startYear}
          helperText={errors.startYear?.message}
          {...register('startYear', { valueAsNumber: true })}
        />

        <Input
          label="Graduated Year"
          type="number"
          placeholder="e.g., 2019"
          error={!!errors.graduatedYear}
          helperText={errors.graduatedYear?.message}
          {...register('graduatedYear', { valueAsNumber: true })}
        />

        <Input
          label="Degree Type"
          placeholder="e.g., Bachelor's, Master's"
          error={!!errors.degreeType}
          helperText={errors.degreeType?.message}
          {...register('degreeType')}
        />

        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} color="textSecondary" sx={{ mb: 1 }}>
            Minh chứng (Tùy chọn)
          </Typography>
          <Button variant="outlined" component="label" fullWidth disabled={loading}>
            {proofFile ? 'Đổi file minh chứng' : 'Upload file minh chứng'}
            <input
              hidden
              type="file"
              accept=".pdf,image/jpeg,image/png"
              onChange={handleProofFileChange}
            />
          </Button>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
            {proofFile
              ? `Đã chọn: ${proofFile.name}`
              : 'Hỗ trợ PDF/JPG/PNG, tối đa 5MB.'}
          </Typography>
        </Box>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
          sx={{
            mt: 2,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Registering...
            </>
          ) : (
            'Register to Organization'
          )}
        </Button>

        {/* Cancel Button */}
        <Button
          variant="outlined"
          fullWidth
          size="large"
          onClick={() => navigate('/auth/login', { replace: true })}
          disabled={loading}
          sx={{
            textTransform: 'none',
          }}
        >
          Cancel
        </Button>
      </Box>
    </Page>
  );
};

export default OrganizationRegistrationPage;