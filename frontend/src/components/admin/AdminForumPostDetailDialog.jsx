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
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const formatDate = (value) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
};

const InfoRow = ({ label, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ mt: 0.25 }}>
      {children}
    </Typography>
  </Box>
);

const AdminForumPostDetailDialog = ({
  open,
  post,
  statusLabel,
  statusColor,
  onClose,
  onBan,
  onUnban,
}) => {
  if (!post) {
    return null;
  }

  const isBanned = post.isBanned === true || post.isBanned === 'true';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="body">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>Chi tiết bài viết</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            ID: {post.id}
          </Typography>
          <Chip label={statusLabel} color={statusColor} size="small" variant="outlined" />
          <Chip label={`${post.flagsCount ?? 0} báo cáo`} size="small" variant="outlined" />
          {isBanned && (
            <Chip label="Đã chặn" color="error" size="small" variant="filled" />
          )}
          {post.isLike && (
            <Chip label="Đã thích" color="info" size="small" variant="outlined" />
          )}
        </Box>

        <InfoRow label="Chủ đề">{post.topicTitle || '-'}</InfoRow>
        <InfoRow label="Tác giả">{post.authorName || '-'}</InfoRow>

        {post.answerToPostId && (
          <InfoRow label="Trả lời cho bài viết">#{post.answerToPostId}</InfoRow>
        )}

        <Box>
          <Typography variant="caption" color="text.secondary">
            Nội dung
          </Typography>
          {post.content ? (
            <Box
              sx={{
                mt: 0.5,
                typography: 'body2',
                '& img': { maxWidth: '100%', height: 'auto' },
                '& p': { m: 0, mb: 1 }
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <Typography variant="body2" sx={{ mt: 0.5 }}>-</Typography>
          )}
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <InfoRow label="Ngày tạo">{formatDate(post.postedAt || post.createdAt)}</InfoRow>
          {post.updatedAt && (
            <InfoRow label="Cập nhật">{formatDate(post.updatedAt)}</InfoRow>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        {onBan && onUnban && (
          isBanned ? (
            <Button
              onClick={() => onUnban(post.id)}
              variant="outlined"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              sx={{ textTransform: 'none', fontWeight: 700, mr: 'auto' }}
            >
              Bỏ chặn
            </Button>
          ) : (
            <Button
              onClick={() => onBan(post.id)}
              variant="outlined"
              color="error"
              startIcon={<BlockOutlinedIcon />}
              sx={{ textTransform: 'none', fontWeight: 700, mr: 'auto' }}
            >
              Chặn
            </Button>
          )
        )}
        <Button onClick={onClose} variant="contained" color="secondary" sx={{ textTransform: 'none', fontWeight: 700 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminForumPostDetailDialog;
