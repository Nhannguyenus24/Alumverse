import { Box, IconButton, Paper, TextField, Typography } from '@mui/material';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';

const ForumManageTopicItem = ({
  topic,
  newSubTopicValue,
  onNewSubTopicChange,
  onAddSubTopic,
  onDeleteTopic,
  onDeleteBoard,
}) => {
  const { t } = useTranslation('forum');
  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 0,
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      <Box
        sx={{
          px: { xs: 1.5, sm: 2, md: 2.75 },
          py: { xs: 1.2, sm: 1.4, md: 1.7 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1,
          backgroundColor: '#0B4D8D',
          color: '#fff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatBubbleOutlineOutlinedIcon
            sx={{
              fontSize: 22,
              color: '#fff',
              '& path': { fill: 'none', stroke: '#fff', strokeWidth: 1.5 },
            }}
          />
          <Typography
            variant="subtitle1"
            fontWeight={900}
            sx={{ letterSpacing: 0.8, fontSize: { xs: '0.9rem', md: '1rem' } }}
          >
            {topic.title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" sx={{ color: '#fff' }} aria-label={t('edit_topic_aria')}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: '#fff' }}
            onClick={() => onDeleteTopic(topic.id)}
            aria-label={t('delete_topic_aria')}
          >
            <DeleteOutlineOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Box>
        {topic.boards.map((board, idx) => (
          <Box
            key={board.id}
            sx={{
              px: { xs: 1.5, sm: 2, md: 2.75 },
              py: 1.5,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 1,
              borderBottom: idx === topic.boards.length - 1 ? 0 : 1,
              borderColor: 'divider',
            }}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                {board.name}
              </Typography>
              {board.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {board.description}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size="small" sx={{ color: 'text.primary' }} aria-label={t('edit_board_aria')}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{ color: 'error.main' }}
                onClick={() => onDeleteBoard(topic.id, board.id)}
                aria-label={t('delete_board_aria')}
              >
                <DeleteOutlineOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
        <Box
          sx={{
            px: { xs: 1.5, sm: 2, md: 2.75 },
            py: 2,
            borderTop: 1,
            borderColor: 'divider',
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
                placeholder={t('add_subtopic_placeholder')}
                value={newSubTopicValue ?? ''}
                onChange={(e) => onNewSubTopicChange(topic.id, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAddSubTopic(topic.id)}
                size="small"
                InputProps={{ sx: { backgroundColor: 'grey.50' } }}
              />
              <TextField
                fullWidth
                placeholder={t('subtopic_desc_placeholder')}
                size="small"
                InputProps={{ sx: { backgroundColor: 'grey.50' } }}
              />
            </Box>
            <IconButton
              size="small"
              onClick={() => onAddSubTopic(topic.id)}
              sx={{ color: 'success.main', flexShrink: 0 }}
              aria-label={t('save_subtopic_aria')}
            >
              <SaveIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ForumManageTopicItem;
