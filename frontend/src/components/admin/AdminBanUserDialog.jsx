import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { BAN_REASON_OPTIONS } from '../../constants/adminDefaultUsers';

const AdminBanUserDialog = ({ open, user, onClose, onConfirm, loading = false }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [reason, setReason] = useState('SPAM');
  const [customReason, setCustomReason] = useState('');
  const [isPermanent, setIsPermanent] = useState(true);
  const [durationDays, setDurationDays] = useState(7);

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevUserId, setPrevUserId] = useState(user?.id);

  if (open && (!prevOpen || user?.id !== prevUserId)) {
    setPrevOpen(open);
    setPrevUserId(user?.id);
    setReason('SPAM');
    setCustomReason('');
    setIsPermanent(true);
    setDurationDays(7);
  }
  
  if (!open && prevOpen) {
    setPrevOpen(false);
  }

  const handleConfirm = () => {
    if (reason === 'OTHER' && !customReason.trim()) {
      return;
    }
    onConfirm({
      reason,
      customReason,
      isPermanent,
      durationDays: isPermanent ? null : durationDays,
    });
  };

  const disableConfirm =
    loading || (reason === 'OTHER' && !customReason.trim()) || (!isPermanent && (!durationDays || durationDays < 1));

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm" scroll="body">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>{t('admin:ban_user_dialog_title')}</DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: 1,
          overflow: 'visible',
        }}
      >
        {user ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {user.fullName || t('admin:unknown_user')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {user.studentId || '-'} · {user.email || '-'}
            </Typography>
          </Box>
        ) : null}

        <TextField
          select
          label={t('admin:ban_reason_label')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        >
          {BAN_REASON_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        {reason === 'OTHER' ? (
          <TextField
            label={t('admin:ban_reason_other')}
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            fullWidth
            required
            multiline
            minRows={2}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        ) : null}

        <FormControlLabel
          control={
            <Switch
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              color="primary"
            />
          }
          label={t('admin:ban_permanent')}
        />

        {!isPermanent ? (
          <TextField
            type="number"
            label={t('admin:ban_duration_days')}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            fullWidth
            inputProps={{ min: 1, max: 365 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="secondary" onClick={onClose} disabled={loading} sx={{ textTransform: 'none' }}>
          {t('common:cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={disableConfirm}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {t('common:confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminBanUserDialog;
