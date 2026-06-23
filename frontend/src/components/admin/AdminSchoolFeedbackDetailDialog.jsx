import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { formatDateTime } from '../../utils/dateFormatter';

const InfoRow = ({ label, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ mt: 0.25 }}>
      {children}
    </Typography>
  </Box>
);

const AdminSchoolFeedbackDetailDialog = ({
  open,
  feedback,
  onClose,
  onMarkAsRead,
}) => {
  const { t } = useTranslation(['common', 'admin']);
  if (!feedback) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>{t('admin:feedback_detail_title')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            ID: {feedback.id}
          </Typography>
          {feedback.isRead ? (
            <Chip label={t('admin:feedback_status_read')} size="small" variant="outlined" color="default" />
          ) : (
            <Chip label={t('admin:feedback_status_new')} color="primary" size="small" />
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <InfoRow label={t('common:full_name')}>{feedback.fullName}</InfoRow>
          <InfoRow label="Email">{feedback.email}</InfoRow>
          <InfoRow label={t('common:phone_number')}>{feedback.phone || '-'}</InfoRow>
          <InfoRow label={t('admin:feedback_sent_date')}>{formatDateTime(feedback.createdAt)}</InfoRow>
        </Box>

        <Divider />

        <InfoRow label={t('common:subject')}>{feedback.subject}</InfoRow>

        <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1.5, border: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>
            {t('common:content')}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1, lineHeight: 1.6 }}>
            {feedback.content}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
        {!feedback.isRead && onMarkAsRead && (
          <Button
            onClick={() => onMarkAsRead(feedback.id)}
            variant="outlined"
            color="success"
            startIcon={<MarkEmailReadOutlinedIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, mr: 'auto' }}
          >
            {t('admin:feedback_mark_as_read')}
          </Button>
        )}
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {t('common:close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminSchoolFeedbackDetailDialog;
