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
import { USER_ROLES, USER_STATUSES } from '../../constants/adminDefaultUsers';
import { formatAccountStatusLabel } from '../../constants/adminStatusDisplay';

const GRADUATION_STATUSES = ['STUDYING', 'GRADUATED', 'DROPPED'];
const VERIFICATION_LEVELS = [0, 1, 2, 3];

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

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setShowPassword(false);
      if (mode === 'edit' && user) {
        setForm({
          email: user.email || '',
          studentId: user.studentId || '',
          fullName: resolvedFullNameForEdit(user),
          password: '',
          role: user.role || 'USER',
          status: user.status || 'ACTIVE',
          organizationId: user.organizationId ?? firstOrganizationId,
          verificationLevel: user.verificationLevel ?? 0,
          isTrustedVerifier: user.isTrustedVerifier ?? false,
          program: Array.isArray(user.program) ? user.program[0] ?? '' : user.program || '',
          major: Array.isArray(user.major) ? user.major[0] ?? '' : user.major || '',
          graduatedYear: Array.isArray(user.graduatedYear) ? user.graduatedYear[0] ?? '' : user.graduatedYear || '',
          graduationStatus: Array.isArray(user.graduationStatus) ? user.graduationStatus[0] ?? '' : user.graduationStatus || '',
        });
      } else {
        setForm({ ...defaultEmptyForm, role: 'USER', organizationId: firstOrganizationId });
      }
      setErrors({});
    }, 0);
    return () => clearTimeout(timer);
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
      next.graduatedYear = 'Năm tốt nghiệp phải là 4 chữ số (vd: 2024)';
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
    const payload = {
      email: form.email,
      studentId: form.studentId,
      fullName: form.fullName,
      role: form.role,
      status: form.status,
      organizationId: Number(form.organizationId),
      organizationName: org?.name ?? '',
      verificationLevel: Number(form.verificationLevel),
      isTrustedVerifier: Boolean(form.isTrustedVerifier),
      program: form.program.trim() ? [form.program.trim()] : undefined,
      major: form.major.trim() ? [form.major.trim()] : undefined,
      graduatedYear: form.graduatedYear ? [Number(form.graduatedYear)] : undefined,
      graduationStatus: form.graduationStatus ? [form.graduationStatus] : undefined,
    };
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

        {/* ── Thông tin tài khoản ── */}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
          Thông tin tài khoản
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
            fullWidth
            slotProps={slotProps}
          />
          <TextField
            label={t('profile:full_name', 'Họ tên')}
            value={form.fullName}
            onChange={handleChange('fullName')}
            error={!!errors.fullName}
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
            {USER_STATUSES.map((s) => <MenuItem key={s} value={s}>{formatAccountStatusLabel(s)}</MenuItem>)}
          </TextField>
        </Box>

        <Divider />

        {/* ── Học vấn ── */}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
          Học vấn & xác thực
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Chương trình đào tạo"
            value={form.program}
            onChange={handleChange('program')}
            fullWidth
            placeholder="vd: Chính quy"
            slotProps={slotProps}
          />
          <TextField
            label="Ngành học"
            value={form.major}
            onChange={handleChange('major')}
            fullWidth
            placeholder="vd: Công nghệ thông tin"
            slotProps={slotProps}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Năm tốt nghiệp"
            value={form.graduatedYear}
            onChange={handleChange('graduatedYear')}
            error={!!errors.graduatedYear}
            helperText={errors.graduatedYear}
            fullWidth
            placeholder="vd: 2024"
            slotProps={slotProps}
          />
          <TextField
            select
            label="Tình trạng tốt nghiệp"
            value={form.graduationStatus}
            onChange={handleChange('graduationStatus')}
            fullWidth
            slotProps={slotProps}
          >
            <MenuItem value="">— Không chọn —</MenuItem>
            {GRADUATION_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s === 'STUDYING' ? 'Đang học' : s === 'GRADUATED' ? 'Đã tốt nghiệp' : 'Bỏ học'}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <TextField
          select
          label="Cấp độ xác thực"
          value={form.verificationLevel}
          onChange={handleChange('verificationLevel')}
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
          label={t('admin:trusted_verifier_label', { defaultValue: 'Người xác minh tin cậy' })}
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
