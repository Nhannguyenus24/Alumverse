import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { ADMIN_ORGANIZATION_OPTIONS, USER_ROLES, USER_STATUSES } from '../../constants/adminDefaultUsers';

const emptyForm = {
  email: '',
  userName: '',
  fullName: '',
  password: '',
  role: 'USER',
  status: 'ACTIVE',
  organizationId: ADMIN_ORGANIZATION_OPTIONS[0]?.id ?? 1,
};

const AdminUserFormDialog = ({ open, mode, user, onClose, onSubmit }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      return;
    }
    if (mode === 'edit' && user) {
      setForm({
        email: user.email || '',
        userName: user.userName || '',
        fullName: user.fullName || '',
        password: '',
        role: user.role || 'USER',
        status: user.status || 'ACTIVE',
        organizationId: user.organizationId ?? ADMIN_ORGANIZATION_OPTIONS[0]?.id ?? 1,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [open, mode, user]);

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

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }
    const org = ADMIN_ORGANIZATION_OPTIONS.find((o) => o.id === Number(form.organizationId));
    const payload = {
      email: form.email,
      userName: form.userName,
      fullName: form.fullName,
      role: form.role,
      status: form.status,
      organizationId: Number(form.organizationId),
      organizationName: org?.name ?? '',
    };
    if (mode === 'create' || (mode === 'edit' && form.password)) {
      payload.password = form.password;
    }
    onSubmit(payload);
    onClose();
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
          type="password"
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
          slotProps={{ inputLabel: inputLabelSlotProps }}
        />
        <TextField
          select
          label="Organization"
          value={form.organizationId}
          onChange={handleChange('organizationId')}
          fullWidth
          slotProps={{ inputLabel: inputLabelSlotProps }}
        >
          {ADMIN_ORGANIZATION_OPTIONS.map((org) => (
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
