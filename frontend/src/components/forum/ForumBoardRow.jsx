import { Box, Divider, Typography } from '@mui/material';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import { useTranslation } from 'react-i18next';

const StatCell = ({ label, value, showLabel = true }) => {
  return (
    <Box sx={{ textAlign: 'center' }}>
      {showLabel && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.1 }}>
          {label}
        </Typography>
      )}
      <Typography variant="body2" fontWeight={800} color="text.primary">
        {value}
      </Typography>
    </Box>
  );
};

const ForumBoardRow = ({ board, onClick, onAuthorClick }) => {
  const { t } = useTranslation(['forum']);
  const last = board?.lastPost;
  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 1.75, md: 2.75 },
        py: { xs: 1, sm: 1.5, md: 2.4 },
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: { xs: 0.75, md: 2.5 },
        }}
      >
        {/* Board info */}
        <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0, flex: { md: '1 1 0' } }}>
          <ChatBubbleOutlineOutlinedIcon
            sx={{ mt: 0.25, fontSize: 22, color: 'text.secondary', flexShrink: 0 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              color="text.primary"
              sx={{
                fontSize: { xs: '0.95rem', md: '1rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: { xs: 2, md: 1 },
                WebkitBoxOrient: 'vertical',
              }}
            >
              {board?.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                lineHeight: 1.4,
                fontSize: { xs: '0.85rem', md: '0.9rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: { xs: 2, md: 1 },
                WebkitBoxOrient: 'vertical',
              }}
            >
              {board?.description}
            </Typography>
          </Box>
        </Box>

        {/* Desktop stats + last post */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 4,
            minWidth: 0,
            flex: { md: '0 0 auto' },
            ml: { md: 'auto' },
          }}
        >
          <Box sx={{ display: 'flex', gap: 3 }}>
            <StatCell label={t('forum:topic_count_label')} value={board?.topicCount ?? '-'} />
            <StatCell label={t('forum:member_count_label')} value={board?.participantCount ?? '-'} />
          </Box>
        </Box>

        {/* Mobile stats */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, width: '100%', mt: 0.5 }}>
          <Divider sx={{ my: 0.75, width: '100%' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%', py: 0.25 }}>
            <StatCell label={t('forum:stat_topics')} value={board?.topicCount ?? '-'} />
            <StatCell label={t('forum:stat_members')} value={board?.participantCount ?? '-'} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ForumBoardRow;

