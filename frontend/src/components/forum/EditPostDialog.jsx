import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';

const EditPostDialog = ({
  open,
  post,
  onClose,
  onSave,
  isPending,
  isError,
  errorMessage,
}) => {
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (open && post?.content) {
      setEditContent(post.content);
    }
  }, [open, post?.content]);

  const handleClose = useCallback(() => {
    if (!isPending) {
      onClose();
    }
  }, [isPending, onClose]);

  const handleSave = useCallback(async () => {
    const trimmedContent = editContent.trim();
    if (!trimmedContent) {
      return;
    }
    await onSave(trimmedContent);
  }, [editContent, onSave]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={isPending}
            error={isError}
            helperText={isError ? errorMessage : ''}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isPending || !editContent.trim() || editContent === post?.content}
          startIcon={isPending ? <CircularProgress size={20} /> : undefined}
        >
          {isPending ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPostDialog;
