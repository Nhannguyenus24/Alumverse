import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import { useNotification } from '../../hooks/useNotification';
import WYSIWYG from '../WYSIWYG';
import { useTranslation } from 'react-i18next';
import { prepareRichTextForEdit, hasRichTextContent } from '../../utils/stringUtils';

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

  useEffect(() => {
    if (open && post?.content) {
      const timer = setTimeout(() => setEditContent(prepareRichTextForEdit(post.content)), 0);
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
    if (!hasRichTextContent(editContent)) {
      return;
    }
    await onSave(editContent);
  }, [editContent, onSave]);

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
            !hasRichTextContent(editContent) ||
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
