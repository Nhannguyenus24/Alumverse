import { useEffect, useMemo, useState } from 'react';
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
  userName: '',
  fullName: '',
  password: '',
  role: 'ADMIN',
  status: 'ACTIVE',
  organizationId: '',
};

/** API list often omits fullName; keep edit form aligned with table column fallback. */
const resolvedFullNameForEdit = (u) => {
  if (!u) return '';
  const found = [u.fullName, u.userName, u.email]
    .map((x) => (typeof x === 'string' ? x.trim() : x))
    .find(Boolean);
  return typeof found === 'string' ? found : '';
};

const AdminUserFormDialog = ({ open, mode, user, onClose, onSubmit, organizationOptions = [] }) => {
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
    setShowPassword(false);
    if (mode === 'edit' && user) {
      setForm({
        email: user.email || '',
        userName: user.userName || '',
        fullName: resolvedFullNameForEdit(user),
        password: '',
        role: user.role || 'STUDENT',
        status: user.status || 'ACTIVE',
        organizationId: user.organizationId ?? firstOrganizationId,
      });
    } else {
      setForm({ ...defaultEmptyForm, role: 'ADMIN', organizationId: firstOrganizationId });
    }
    setErrors({});
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
      next.email = 'Email is required';
    }
    if (!form.userName.trim()) {
      next.userName = 'Username is required';
    }
    if (!form.fullName.trim()) {
      next.fullName = 'Full name is required';
    }
    if (mode === 'create' && !form.password) {
      next.password = 'Password is required';
    }
    if (mode === 'edit' && form.password && form.password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    }
    if (mode === 'create' && form.password && form.password.length < 8) {
      next.password = 'Password must be at least 8 characters';
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
      enqueueSnackbar('Organization is required', { variant: 'error' });
      return;
    }
    const org = organizationOptions.find((o) => Number(o.id) === Number(form.organizationId));
    const payload = {
      email: form.email,
      userName: form.userName,
      fullName: form.fullName,
      role: mode === 'create' ? 'ADMIN' : form.role,
      status: form.status,
      organizationId: Number(form.organizationId),
      organizationName: org?.name ?? '',
    };
    if (mode === 'create' || (mode === 'edit' && form.password)) {
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
        {mode === 'create' ? 'Create user' : 'Edit user'}
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
          label="Username"
          value={form.userName}
          onChange={handleChange('userName')}
          error={!!errors.userName}
          fullWidth
          required
          slotProps={{ inputLabel: inputLabelSlotProps }}
        />
        <TextField
          label="Full name"
          value={form.fullName}
          onChange={handleChange('fullName')}
          error={!!errors.fullName}
          fullWidth
          required
          slotProps={{ inputLabel: inputLabelSlotProps }}
        />
        <TextField
          label={mode === 'edit' ? 'New password (optional)' : 'Password'}
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={handleChange('password')}
          error={!!errors.password}
          helperText={
            errors.password
              ? undefined
              : mode === 'edit'
                ? 'Leave blank to keep current password'
                : undefined
          }
          fullWidth
          autoComplete="new-password"
          slotProps={{
            inputLabel: inputLabelSlotProps,
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
          label="Organization"
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
            label="Role"
            value={form.role}
            onChange={handleChange('role')}
            disabled={mode === 'create'}
            fullWidth
            slotProps={{ inputLabel: inputLabelSlotProps }}
          >
            {(mode === 'create' ? ['ADMIN'] : USER_ROLES).map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
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
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} sx={{ textTransform: 'none', fontWeight: 700 }}>
          {mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminUserFormDialog;
