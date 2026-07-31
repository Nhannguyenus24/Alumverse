import { Box, IconButton, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ForumManageTopicItem from './ForumManageTopicItem';
import { useTranslation } from 'react-i18next';

const ForumManageView = ({
  manageTopics,
  newMainTopic,
  setNewMainTopic,
  newMainTopicDesc,
  setNewMainTopicDesc,
  handleAddMainTopic,
  newSubTopics,
  newSubTopicDescs,
  setNewSubTopics,
  setNewSubTopicDescs,
  handleAddSubTopic,
  handleDeleteTopic,
  handleDeleteBoard,
}) => {
  const { t } = useTranslation('forum');

  const handleNewSubTopicChange = (topicId, value) => {
    setNewSubTopics((prev) => ({ ...prev, [topicId]: value }));
  };

  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, topicId: null, boardId: null });

  const confirmDeleteTopic = (topicId) => {
    setDeleteDialog({ open: true, type: 'topic', topicId, boardId: null });
  };

  const confirmDeleteBoard = (topicId, boardId) => {
    setDeleteDialog({ open: true, type: 'board', topicId, boardId });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.type === 'topic') {
      handleDeleteTopic(deleteDialog.topicId);
    } else if (deleteDialog.type === 'board') {
      handleDeleteBoard(deleteDialog.topicId, deleteDialog.boardId);
    }
    setDeleteDialog({ open: false, type: null, topicId: null, boardId: null });
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 0,
          p: { xs: 1.5, sm: 2 },
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
          }}
        >
          <AddIcon sx={{ fontSize: 36, color: 'primary.main', flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              fullWidth
              placeholder={t('add_main_topic_placeholder')}
              value={newMainTopic}
              onChange={(e) => setNewMainTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMainTopic()}
              size="small"
              InputProps={{ sx: { backgroundColor: 'background.default' } }}
            />
            <TextField
              fullWidth
              placeholder={t('main_topic_desc_placeholder')}
              size="small"
              value={newMainTopicDesc}
              onChange={(e) => setNewMainTopicDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMainTopic()}
              InputProps={{ sx: { backgroundColor: 'background.default' } }}
            />
          </Box>
          <IconButton
            size="small"
            onClick={handleAddMainTopic}
            sx={{ color: 'success.main', flexShrink: 0 }}
            aria-label={t('add_main_topic_aria')}
          >
            <AddIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </Box>
      </Paper>
      {manageTopics.map((topic) => (
        <ForumManageTopicItem
          key={topic.id}
          topic={topic}
          newSubTopicValue={newSubTopics[topic.id]}
          newSubTopicDescValue={newSubTopicDescs[topic.id]}
          onNewSubTopicChange={(topicId, val) => setNewSubTopics((prev) => ({ ...prev, [topicId]: val }))}
          onNewSubTopicDescChange={(topicId, val) => setNewSubTopicDescs((prev) => ({ ...prev, [topicId]: val }))}
          onAddSubTopic={handleAddSubTopic}
          onDeleteTopic={confirmDeleteTopic}
          onDeleteBoard={confirmDeleteBoard}
        />
      ))}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
      >
        <DialogTitle>{t('common:confirm_delete', { defaultValue: 'Xác nhận xoá' })}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog.type === 'topic'
              ? t('forum:confirm_delete_topic_message', { defaultValue: 'Bạn có chắc chắn muốn xoá chủ đề chính này và tất cả chủ đề con của nó không?' })
              : t('forum:confirm_delete_board_message', { defaultValue: 'Bạn có chắc chắn muốn xoá chủ đề con này không?' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })} color="primary">
            {t('common:cancel')}
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            {t('common:delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ForumManageView;
