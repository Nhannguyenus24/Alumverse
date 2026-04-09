import { useEffect, useState } from 'react';
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
  const [reason, setReason] = useState('SPAM');
  const [customReason, setCustomReason] = useState('');
  const [isPermanent, setIsPermanent] = useState(true);
  const [durationDays, setDurationDays] = useState(7);

  useEffect(() => {
    if (!open) {
      return;
    }
    setReason('SPAM');
    setCustomReason('');
    setIsPermanent(true);
    setDurationDays(7);
  }, [open, user?.id]);

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
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>Ban User</DialogTitle>
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
              {user.fullName || 'Unknown user'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{user.userName || '-'} · {user.email || '-'}
            </Typography>
          </Box>
        ) : null}

        <TextField
          select
          label="Reason"
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
            label="Custom reason"
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
          label="Permanent ban"
        />

        {!isPermanent ? (
          <TextField
            type="number"
            label="Duration (days)"
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            fullWidth
            inputProps={{ min: 1, max: 365 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={disableConfirm}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminBanUserDialog;
