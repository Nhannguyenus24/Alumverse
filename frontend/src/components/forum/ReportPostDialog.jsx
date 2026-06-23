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
import { useTranslation } from 'react-i18next';

const ReportPostDialog = ({ open, onClose, onConfirm, isPending }) => {
  const { t } = useTranslation(['forum', 'common']);
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
    onConfirm({ reason: reason.trim() });
    setReason('');
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>
        {t('forum:report_post_dialog_title')}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t('forum:report_post_instruction')}
        </Typography>
        <TextField
          label={t('forum:report_reason_label')}
          fullWidth
          required
          size="small"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isPending}
        />
        <TextField
          label={t('forum:report_detail_label')}
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
          {t('common:cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={!reason.trim() || isPending}
        >
          {t('common:report')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportPostDialog;
