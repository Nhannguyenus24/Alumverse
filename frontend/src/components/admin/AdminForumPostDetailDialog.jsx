import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

const AdminForumPostDetailDialog = ({ open, post, statusLabel, statusColor, onClose }) => {
  if (!post) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="body">
      <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>Post detail</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            ID: {post.id}
          </Typography>
          <Chip label={statusLabel} color={statusColor} size="small" variant="outlined" />
          <Chip label={`${post.flagsCount ?? 0} flags`} size="small" variant="outlined" />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Topic
          </Typography>
          <Typography variant="subtitle1" fontWeight={700}>
            {post.topicTitle || '-'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Author
          </Typography>
          <Typography variant="body1">{post.authorName || '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Content
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
            {post.content || '-'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminForumPostDetailDialog;
