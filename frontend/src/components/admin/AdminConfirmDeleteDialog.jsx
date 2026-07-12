

import { useTranslation } from 'react-i18next';

const AdminConfirmDeleteDialog = ({
  open,
  title,
  description,
  onClose,
  onConfirm,
  loading,
  confirmLabel,
  titleColor = 'error.main',
  confirmColor = 'error',
}) => {
  const { t } = useTranslation('common');

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
          {t('cancel')}
        </Button>
        <Button
          color={confirmColor}
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {confirmLabel ?? t('delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminConfirmDeleteDialog;
