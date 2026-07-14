import { Avatar, Box, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { formatRelativeTimeVi } from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';

const getInitial = (name) => {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  return trimmed ? trimmed.charAt(0).toUpperCase() : '';
};

const ForumTopicListItem = ({ topic, onClick }) => {
  const { t } = useTranslation(['forum']);
  const authorName = topic.authorName?.trim() || `${t('forum:member_prefix')}${topic.createdByMemberId ?? '—'}`;
  return (
    <Box
      onClick={() => onClick(topic)}
      sx={{
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 1.5, md: 2 },
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: { xs: 1.5, md: 3 },
        borderTop: 1,
        borderColor: 'divider',
        cursor: 'pointer',
        '&:hover': { backgroundColor: 'action.hover' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              fontSize: { xs: '0.95rem', md: '1rem' },
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {topic.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('forum:created_at_label')} · {formatRelativeTimeVi(topic.createdAt)}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: { xs: 2, md: 3 },
          ml: { md: 'auto' },
          flexShrink: 0,
        }}
      >
        <Box sx={{ textAlign: 'center', minWidth: { xs: 56, sm: 72 } }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {t('forum:views')}
          </Typography>
          <Typography variant="body2" fontWeight={800}>
            {topic.viewCount ?? 0}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: { xs: 56, sm: 72 } }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {t('forum:discussions')}
          </Typography>
          <Typography variant="body2" fontWeight={800}>
            {topic.postCount ?? 0}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: { xs: 120, sm: 160 },
            justifyContent: 'flex-end',
          }}
        >
          <Avatar
            src={topic.authorAvatarUrl || undefined}
            alt={authorName}
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              flexShrink: 0,
            }}
          >
            {getInitial(authorName) || <PersonIcon sx={{ fontSize: 18 }} />}
          </Avatar>
          <Box sx={{ textAlign: 'left', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.15 }}>
              {authorName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
              {formatRelativeTimeVi(topic.createdAt)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ForumTopicListItem;
