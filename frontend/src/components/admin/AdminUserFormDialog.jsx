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
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { USER_ROLES, USER_STATUSES } from '../../constants/adminDefaultUsers';

const defaultEmptyForm = {
  email: '',
  studentId: '',
  fullName: '',
  password: '',
  role: 'ALUMNI',
  status: 'ACTIVE',
  organizationId: '',
};

/** API list often omits fullName; keep edit form aligned with table column fallback. */
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
    if (!open) {
      return;
    }
    const timer = setTimeout(() => {
      setShowPassword(false);
      if (mode === 'edit' && user) {
        setForm({
          email: user.email || '',
          studentId: user.studentId || '',
          fullName: resolvedFullNameForEdit(user),
          password: '',
          role: user.role || 'STUDENT',
          status: user.status || 'ACTIVE',
          organizationId: user.organizationId ?? firstOrganizationId,
        });
      } else {
        setForm({ ...defaultEmptyForm, role: 'ALUMNI', organizationId: firstOrganizationId });
      }
      setErrors({});
    }, 0);
    return () => clearTimeout(timer);
  }, [open, mode, user, firstOrganizationId]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) {
      next.email = t('admin:error_email_required');
    }
    if (!form.studentId.trim()) {
      next.studentId = t('admin:error_student_id_required');
    }
    if (!form.fullName.trim()) {
      next.fullName = t('admin:error_full_name_required');
    }
    if (mode === 'create' && form.password && form.password.length < 8) {
      next.password = t('admin:error_password_min_length');
    }
    if (mode === 'edit' && form.password && form.password.length < 8) {
      next.password = t('admin:error_password_min_length');
    }
    setErrors(next);
    const keys = Object.keys(next);
    if (keys.length > 0) {
      enqueueSnackbar(next[keys[0]], { variant: 'error' });
    }
    return keys.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }
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
    };
    if (form.password) {
      payload.password = form.password;
    }
    try {
      await Promise.resolve(onSubmit(payload));
      onClose();
    } catch {
      // Parent / hook shows errors; keep dialog open
    }
  };

  // Keeps OutlinedInput `notched` in sync with the label inside Dialog (MUI v7).
  const inputLabelSlotProps = { shrink: true };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="body">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>
        {mode === 'create' ? t('admin:create_user') : t('admin:edit_user')}
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: 1,
          overflow: 'visible',
        }}
      >
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange('email')}
          error={!!errors.email}
          fullWidth
          required
          slotProps={{ inputLabel: inputLabelSlotProps }}
        />
        <TextField
          label={t('admin:student_id_label')}
          value={form.studentId}
          onChange={handleChange('studentId')}
          error={!!errors.studentId}
          fullWidth
          required
          slotProps={{ inputLabel: inputLabelSlotProps }}
        />
        <TextField
          label={t('profile:full_name', 'Họ tên')}
          value={form.fullName}
          onChange={handleChange('fullName')}
          error={!!errors.fullName}
          fullWidth
          required
          slotProps={{ inputLabel: inputLabelSlotProps }}
        />
        <TextField
          label={mode === 'edit' ? t('admin:password_new_optional') : t('admin:password_default_hint')}
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={handleChange('password')}
          error={!!errors.password}
          helperText={
            errors.password
              ? undefined
              : mode === 'edit'
                ? t('admin:password_keep_hint')
                : t('admin:password_default_keep_hint')
          }
          fullWidth
          autoComplete="new-password"
          slotProps={{
            inputLabel: inputLabelSlotProps,
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? t('admin:hide_password') : t('admin:show_password')}
                    onClick={() => setShowPassword((v) => !v)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
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
          slotProps={{ inputLabel: inputLabelSlotProps }}
        >
          {organizationOptions.map((org) => (
            <MenuItem key={org.id} value={org.id}>
              {org.name}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <TextField
            select
            label={t('admin:role_label')}
            value={form.role}
            onChange={handleChange('role')}
            fullWidth
            slotProps={{ inputLabel: inputLabelSlotProps }}
          >
            {USER_ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t('admin:status_label')}
            value={form.status}
            onChange={handleChange('status')}
            fullWidth
            slotProps={{ inputLabel: inputLabelSlotProps }}
          >
            {USER_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        {mode === 'create' ? (
          <Typography variant="caption" color="text.secondary">
            Password is stored locally for this demo only. Connect API later for real auth.
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="secondary"onClick={onClose} sx={{ textTransform: 'none' }}>
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
