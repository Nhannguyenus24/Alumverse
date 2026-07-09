import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  GRADUATION_STATUSES,
  USER_ROLES,
  VERIFICATION_LEVELS,
} from '../../constants/adminDefaultUsers';
import { formatAccountStatusLabel } from '../../constants/adminStatusDisplay';
import { getTrustedVerifiers } from '../../utils/api';

const defaultEmptyForm = {
  email: '',
  studentId: '',
  fullName: '',
  password: '',
  role: 'USER',
  status: 'ACTIVE',
  organizationId: '',
  verificationLevel: 0,
  isTrustedVerifier: false,
  program: '',
  major: '',
  graduatedYear: '',
  graduationStatus: '',
};

const resolvedFullNameForEdit = (u) => {
  if (!u) return '';
  const found = [u.fullName, u.studentId, u.email]
    .map((x) => (typeof x === 'string' ? x.trim() : x))
    .find(Boolean);
  return typeof found === 'string' ? found : '';
};

const getVerifierUserId = (verifier) => verifier?.userId ?? verifier?.id ?? verifier?.user_id;

const normalizeComparableValue = (value) => {
  if (Array.isArray(value)) {
    const normalized = value
      .map(normalizeComparableValue)
      .filter((item) => item !== null && item !== '');
    return normalized.length === 1 ? normalized[0] : normalized;
  }
  if (typeof value === 'string') return value.trim();
  if (value === undefined || value === null || value === '') return null;
  return value;
};

const sameFormValue = (left, right) => (
  JSON.stringify(normalizeComparableValue(left)) === JSON.stringify(normalizeComparableValue(right))
);

const ACCOUNT_STATUS_OPTIONS = [
  'ACTIVE',
  'INACTIVE',
  'BANNED',
  'SUSPENDED',
  'DELETED',
  'DISABLED',
];

const AdminUserFormDialog = ({ open, mode, user, onClose, onSubmit, organizationOptions = [] }) => {
  const { t } = useTranslation(['admin', 'common', 'profile']);
  const { enqueueSnackbar } = useSnackbar();
  const firstOrganizationId = useMemo(
    () => (organizationOptions.length > 0 ? Number(organizationOptions[0].id) : ''),
    [organizationOptions],
  );
  const [form, setForm] = useState(() => ({ ...defaultEmptyForm, organizationId: firstOrganizationId }));
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [initialTrustedVerifier, setInitialTrustedVerifier] = useState(false);
  const [initialForm, setInitialForm] = useState(null);
  const isEditMode = mode === 'edit';
  const isMembershipReadOnly = isEditMode;
  const isProfileReadOnly = isEditMode;

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = setTimeout(() => {
      setShowPassword(false);
      if (mode === 'edit' && user) {
        const resolvedOrganizationId = user.organizationId ?? firstOrganizationId;
        const trustedVerifierValue = Boolean(user.isTrustedVerifier);
        const nextForm = {
          email: user.email || '',
          studentId: user.studentId || '',
          fullName: resolvedFullNameForEdit(user),
          password: '',
          role: user.role || 'USER',
          status: user.status || 'ACTIVE',
          organizationId: resolvedOrganizationId,
          verificationLevel: user.verificationLevel ?? 0,
          isTrustedVerifier: trustedVerifierValue,
          program: Array.isArray(user.program) ? user.program[0] ?? '' : user.program || '',
          major: Array.isArray(user.major) ? user.major[0] ?? '' : user.major || '',
          graduatedYear: Array.isArray(user.graduatedYear) ? user.graduatedYear[0] ?? '' : user.graduatedYear || '',
          graduationStatus: Array.isArray(user.graduationStatus) ? user.graduationStatus[0] ?? '' : user.graduationStatus || '',
        };
        setInitialTrustedVerifier(trustedVerifierValue);
        setInitialForm(nextForm);
        setForm(nextForm);
        if (resolvedOrganizationId && (user.isTrustedVerifier === undefined || user.isTrustedVerifier === null)) {
          getTrustedVerifiers(resolvedOrganizationId)
            .then((response) => {
              if (!active) return;
              const verifiers = Array.isArray(response?.data?.data) ? response.data.data : [];
              const isTrusted = verifiers.some((verifier) => Number(getVerifierUserId(verifier)) === Number(user.id));
              setInitialTrustedVerifier(isTrusted);
              setInitialForm((prev) => (prev ? { ...prev, isTrustedVerifier: isTrusted } : prev));
              setForm((prev) => ({ ...prev, isTrustedVerifier: isTrusted }));
            })
            .catch(() => {
              // Keep the current form value if the public verifier lookup is unavailable.
            });
        }
      } else {
        setInitialTrustedVerifier(false);
        setInitialForm(null);
        setForm({ ...defaultEmptyForm, role: 'USER', organizationId: firstOrganizationId });
      }
      setErrors({});
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, mode, user, firstOrganizationId]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = t('admin:error_email_required');
    if (!form.fullName.trim()) next.fullName = t('admin:error_full_name_required');
    if (form.password && form.password.length < 8) next.password = t('admin:error_password_min_length');
    if (form.graduatedYear && !/^\d{4}$/.test(String(form.graduatedYear).trim())) {
      next.graduatedYear = t('admin:error_graduated_year_format');
    }
    setErrors(next);
    const keys = Object.keys(next);
    if (keys.length > 0) enqueueSnackbar(next[keys[0]], { variant: 'error' });
    return keys.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!form.organizationId) {
      enqueueSnackbar(t('admin:error_org_required'), { variant: 'error' });
      return;
    }
    const org = organizationOptions.find((o) => Number(o.id) === Number(form.organizationId));
    const fullPayload = {
      email: form.email,
      role: form.role,
      status: form.status,
    };
    if (!isEditMode) {
      Object.assign(fullPayload, {
        studentId: form.studentId,
        fullName: form.fullName,
        organizationId: Number(form.organizationId),
        organizationName: org?.name ?? '',
        verificationLevel: Number(form.verificationLevel),
        program: form.program.trim() ? [form.program.trim()] : undefined,
        major: form.major.trim() ? [form.major.trim()] : undefined,
        graduatedYear: form.graduatedYear ? [Number(form.graduatedYear)] : undefined,
        graduationStatus: form.graduationStatus ? [form.graduationStatus] : undefined,
      });
    }
    const payload = mode === 'edit' && initialForm ? {} : { ...fullPayload };
    if (mode === 'edit' && initialForm) {
      Object.entries(fullPayload).forEach(([key, value]) => {
        if (!sameFormValue(value, initialForm[key])) {
          payload[key] = value;
        }
      });
    }
    if (mode !== 'edit' || Boolean(form.isTrustedVerifier) !== initialTrustedVerifier) {
      payload.isTrustedVerifier = Boolean(form.isTrustedVerifier);
      payload.organizationId = Number(form.organizationId);
    }
    if (form.password) payload.password = form.password;
    try {
      await Promise.resolve(onSubmit(payload));
      onClose();
    } catch {
      // Parent shows errors; keep dialog open
    }
  };

  const slotProps = { inputLabel: { shrink: true } };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="body">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>
        {mode === 'create' ? t('admin:create_user') : t('admin:edit_user')}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, overflow: 'visible' }}>

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
          {t('admin:account_info_section')}
        </Typography>

        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange('email')}
          error={!!errors.email}
          fullWidth
          required
          slotProps={slotProps}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label={t('admin:student_id_label')}
            value={form.studentId}
            onChange={handleChange('studentId')}
            disabled={isMembershipReadOnly}
            fullWidth
            slotProps={slotProps}
          />
          <TextField
            label={t('profile:full_name')}
            value={form.fullName}
            onChange={handleChange('fullName')}
            error={!!errors.fullName}
            disabled={isProfileReadOnly}
            fullWidth
            required
            slotProps={slotProps}
          />
        </Box>
        <TextField
          label={mode === 'edit' ? t('admin:password_new_optional') : t('admin:password_default_hint')}
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={handleChange('password')}
          error={!!errors.password}
          helperText={errors.password ?? (mode === 'edit' ? t('admin:password_keep_hint') : t('admin:password_default_keep_hint'))}
          fullWidth
          autoComplete="new-password"
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((v) => !v)} onMouseDown={(e) => e.preventDefault()} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          label={t('admin:organization_label')}
          value={form.organizationId}
          onChange={handleChange('organizationId')}
          disabled={isMembershipReadOnly}
          fullWidth
          slotProps={slotProps}
        >
          {organizationOptions.map((org) => (
            <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            label={t('admin:role_label')}
            value={form.role}
            onChange={handleChange('role')}
            fullWidth
            slotProps={slotProps}
          >
            {USER_ROLES.map((r) => <MenuItem key={r} value={r}>{t(`admin:role.${r}`, { defaultValue: r })}</MenuItem>)}
          </TextField>
          <TextField
            select
            label={t('admin:status_label')}
            value={form.status}
            onChange={handleChange('status')}
            fullWidth
            slotProps={slotProps}
          >
            {ACCOUNT_STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{formatAccountStatusLabel(s, t)}</MenuItem>)}
          </TextField>
        </Box>

        <Divider />

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
          {t('admin:education_verification_section')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label={t('admin:education_program_label')}
            value={form.program}
            onChange={handleChange('program')}
            disabled={isMembershipReadOnly}
            fullWidth
            placeholder={t('admin:education_program_placeholder')}
            slotProps={slotProps}
          />
          <TextField
            label={t('admin:education_major_label')}
            value={form.major}
            onChange={handleChange('major')}
            disabled={isMembershipReadOnly}
            fullWidth
            placeholder={t('admin:education_major_placeholder')}
            slotProps={slotProps}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label={t('admin:graduated_year_label')}
            value={form.graduatedYear}
            onChange={handleChange('graduatedYear')}
            error={!!errors.graduatedYear}
            helperText={errors.graduatedYear}
            disabled={isMembershipReadOnly}
            fullWidth
            placeholder={t('admin:year_placeholder')}
            slotProps={slotProps}
          />
          <TextField
            select
            label={t('admin:graduation_status_label')}
            value={form.graduationStatus}
            onChange={handleChange('graduationStatus')}
            disabled={isMembershipReadOnly}
            fullWidth
            slotProps={slotProps}
          >
            <MenuItem value="">{t('admin:no_selection')}</MenuItem>
            {GRADUATION_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {t(`admin:graduation_status.${s}`)}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <TextField
          select
          label={t('admin:verification_level_label')}
          value={form.verificationLevel}
          onChange={handleChange('verificationLevel')}
          disabled={isMembershipReadOnly}
          fullWidth
          slotProps={slotProps}
        >
          {VERIFICATION_LEVELS.map((level) => (
            <MenuItem key={level} value={level}>
              {level} — {t(`admin:verification_level.${level}`, { defaultValue: String(level) })}
            </MenuItem>
          ))}
        </TextField>

        <FormControlLabel
          control={
            <Switch
              checked={Boolean(form.isTrustedVerifier)}
              onChange={(e) => setForm((prev) => ({ ...prev, isTrustedVerifier: e.target.checked }))}
            />
          }
          label={t('admin:trusted_verifier_label')}
        />

      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="secondary" onClick={onClose} sx={{ textTransform: 'none' }}>
          {t('common:cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} sx={{ textTransform: 'none', fontWeight: 700 }}>
          {mode === 'create' ? t('admin:create_user') : t('admin:save_user_info')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminUserFormDialog;
