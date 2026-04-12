import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import WYSIWYG from '../WYSIWYG';

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

  const stripHtml = useCallback((value) => {
    if (value == null) return '';
    return String(value).replace(/<[^>]*>/g, '').trim();
  }, []);

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
    const trimmedContent = stripHtml(editContent);
    if (!trimmedContent) {
      return;
    }
    await onSave(editContent);
  }, [editContent, onSave, stripHtml]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <WYSIWYG
            value={editContent}
            onChange={setEditContent}
            disabled={isPending}
            height={220}
          />
          {isError ? (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {errorMessage}
            </Typography>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={
            isPending ||
            !stripHtml(editContent) ||
            editContent === (post?.content ?? '')
          }
          startIcon={isPending ? <CircularProgress size={20} /> : undefined}
        >
          {isPending ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPostDialog;
