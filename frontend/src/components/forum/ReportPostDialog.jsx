import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';

const ReportPostDialog = ({ open, onClose, onConfirm, isPending }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const handleClose = () => {
    if (isPending) return;
    setReason('');
    setDescription('');
    onClose();
  };

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm({ reason: reason.trim(), description: description.trim() });
    setReason('');
    setDescription('');
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>
        Báo cáo bài viết
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Vui lòng cung cấp lý do để quản trị viên xem xét.
        </Typography>
        <TextField
          label="Lý do"
          fullWidth
          required
          size="small"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isPending}
        />
        <TextField
          label="Chi tiết (tuỳ chọn)"
          fullWidth
          multiline
          rows={3}
          size="small"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={isPending}>
          Huỷ
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={!reason.trim() || isPending}
        >
          Báo cáo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportPostDialog;
