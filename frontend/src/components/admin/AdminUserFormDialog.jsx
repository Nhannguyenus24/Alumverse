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
  role: 'ALUMNI',
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
    const timer = setTimeout(() => {
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
      next.email = 'Vui lòng nhập email';
    }
    if (!form.userName.trim()) {
      next.userName = 'Vui lòng nhập tên đăng nhập';
    }
    if (!form.fullName.trim()) {
      next.fullName = 'Vui lòng nhập họ tên';
    }
    if (mode === 'create' && form.password && form.password.length < 8) {
      next.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    if (mode === 'edit' && form.password && form.password.length < 8) {
      next.password = 'Mật khẩu phải có ít nhất 8 ký tự';
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
      enqueueSnackbar('Vui lòng chọn tổ chức', { variant: 'error' });
      return;
    }
    const org = organizationOptions.find((o) => Number(o.id) === Number(form.organizationId));
    const payload = {
      email: form.email,
      userName: form.userName,
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
        {mode === 'create' ? 'Tạo người dùng' : 'Sửa người dùng'}
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
          label="Tên đăng nhập"
          value={form.userName}
          onChange={handleChange('userName')}
          error={!!errors.userName}
          fullWidth
          required
          slotProps={{ inputLabel: inputLabelSlotProps }}
        />
        <TextField
          label="Họ tên"
          value={form.fullName}
          onChange={handleChange('fullName')}
          error={!!errors.fullName}
          fullWidth
          required
          slotProps={{ inputLabel: inputLabelSlotProps }}
        />
        <TextField
          label={mode === 'edit' ? 'Mật khẩu mới (tùy chọn)' : 'Mật khẩu (mặc định: Alumni2026@)'}
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={handleChange('password')}
          error={!!errors.password}
          helperText={
            errors.password
              ? undefined
              : mode === 'edit'
                ? 'Để trống nếu không muốn đổi mật khẩu'
                : 'Để trống để dùng mật khẩu mặc định Alumni2026@'
          }
          fullWidth
          autoComplete="new-password"
          slotProps={{
            inputLabel: inputLabelSlotProps,
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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
          label="Tổ chức"
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
            label="Vai trò"
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
            label="Trạng thái"
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
          Hủy
        </Button>
        <Button variant="contained" onClick={handleSubmit} sx={{ textTransform: 'none', fontWeight: 700 }}>
          {mode === 'create' ? 'Tạo người dùng' : 'Lưu thông tin'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminUserFormDialog;
