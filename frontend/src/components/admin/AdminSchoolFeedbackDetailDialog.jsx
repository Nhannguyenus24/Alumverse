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
  const { t } = useTranslation('common');
  if (!feedback) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>Chi tiết phản hồi</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            ID: {feedback.id}
          </Typography>
          {feedback.isRead ? (
            <Chip label="Đã đọc" size="small" variant="outlined" color="default" />
          ) : (
            <Chip label="Phản hồi mới" color="primary" size="small" />
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <InfoRow label="Họ tên">{feedback.fullName}</InfoRow>
          <InfoRow label="Email">{feedback.email}</InfoRow>
          <InfoRow label="Số điện thoại">{feedback.phone || '-'}</InfoRow>
          <InfoRow label="Ngày gửi">{formatDateTime(feedback.createdAt)}</InfoRow>
        </Box>

        <Divider />

        <InfoRow label="Tiêu đề">{feedback.subject}</InfoRow>

        <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1.5, border: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>
            Nội dung
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
            Đánh dấu đã đọc
          </Button>
        )}
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminSchoolFeedbackDetailDialog;
