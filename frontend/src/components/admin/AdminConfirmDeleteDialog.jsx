import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

const AdminConfirmDeleteDialog = ({
  open,
  title,
  description,
  onClose,
  onConfirm,
  loading,
  confirmLabel = 'Xóa',
  titleColor = 'error.main',
  confirmColor = 'error',
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ color: titleColor, fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="secondary" onClick={onClose} sx={{ textTransform: 'none' }}>
          Hủy
        </Button>
        <Button
          color={confirmColor}
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminConfirmDeleteDialog;
