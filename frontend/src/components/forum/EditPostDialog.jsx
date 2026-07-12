import { useCallback, useEffect, useRef, useState } from 'react';


import { useNotification } from '../../hooks/useNotification';
import { useTranslation } from 'react-i18next';

const EditPostDialog = ({
  open,
  post,
  onClose,
  onSave,
  isPending,
  isError,
  errorMessage,
}) => {
  const { t } = useTranslation(['forum', 'common']);
  const [editContent, setEditContent] = useState('');
  const { showError } = useNotification();
  const wasErrorRef = useRef(false);

  const stripHtml = useCallback((value) => {
    if (value == null) return '';
    return String(value).replace(/<[^>]*>/g, '').trim();
  }, []);

  useEffect(() => {
    if (open && post?.content) {
      const timer = setTimeout(() => setEditContent(post.content), 0);
      return () => clearTimeout(timer);
    }
  }, [open, post?.content]);

  useEffect(() => {
    if (isError && !wasErrorRef.current && errorMessage) {
      showError(errorMessage);
    }
    wasErrorRef.current = isError;
  }, [isError, errorMessage, showError]);

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
      <DialogTitle>{t('forum:edit_post_dialog_title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <WYSIWYG
            value={editContent}
            onChange={setEditContent}
            disabled={isPending}
            height={220}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          {t('common:cancel')}
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
          {isPending ? t('forum:saving') : t('common:save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPostDialog;
