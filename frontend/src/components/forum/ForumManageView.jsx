import { Box, IconButton, Paper, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ForumManageTopicItem from './ForumManageTopicItem';
import { useTranslation } from 'react-i18next';

const ForumManageView = ({
  manageTopics,
  newMainTopic,
  setNewMainTopic,
  handleAddMainTopic,
  newSubTopics,
  setNewSubTopics,
  handleAddSubTopic,
  handleDeleteTopic,
  handleDeleteBoard,
}) => {
  const { t } = useTranslation('forum');

  const handleNewSubTopicChange = (topicId, value) => {
    setNewSubTopics((prev) => ({ ...prev, [topicId]: value }));
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
              InputProps={{ sx: { backgroundColor: 'background.default' } }}
            />
          </Box>
          <IconButton
            size="small"
            onClick={handleAddMainTopic}
            sx={{ color: 'success.main', flexShrink: 0 }}
            aria-label={t('save_main_topic_aria')}
          >
            <SaveIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </Box>
      </Paper>
      {manageTopics.map((topic) => (
        <ForumManageTopicItem
          key={topic.id}
          topic={topic}
          newSubTopicValue={newSubTopics[topic.id]}
          onNewSubTopicChange={handleNewSubTopicChange}
          onAddSubTopic={handleAddSubTopic}
          onDeleteTopic={handleDeleteTopic}
          onDeleteBoard={handleDeleteBoard}
        />
      ))}
    </>
  );
};

export default ForumManageView;
