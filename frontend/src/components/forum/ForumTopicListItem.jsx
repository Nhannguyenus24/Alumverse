import { Avatar, Box, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { formatRelativeTimeVi } from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';

const getInitial = (name) => {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  return trimmed ? trimmed.charAt(0).toUpperCase() : '';
};

const ForumTopicListItem = ({ topic, onClick, onAuthorClick }) => {
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
          width: '100%',
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0, width: '100%' }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              fontSize: { xs: '0.95rem', md: '1rem' },
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: { xs: 2, md: 1 },
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
            }}
          >
            {topic.title}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: { xs: 'space-between', md: 'flex-end' },
          gap: { xs: 1.5, md: 3 },
          width: { xs: '100%', md: 'auto' },
          ml: { md: 'auto' },
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 } }}>
          <Box sx={{ textAlign: 'center', minWidth: { xs: 48, sm: 72 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {t('forum:views')}
            </Typography>
            <Typography variant="body2" fontWeight={800}>
              {topic.viewCount ?? 0}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: { xs: 48, sm: 72 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {t('forum:discussions')}
            </Typography>
            <Typography variant="body2" fontWeight={800}>
              {topic.postCount ?? 0}
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: { xs: 'auto', sm: 140 },
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
          }}
        >
          <Avatar
            src={topic.authorAvatarUrl || undefined}
            alt={authorName}
            onClick={(e) => {
              if (onAuthorClick && topic.createdByMemberId) {
                e.stopPropagation();
                onAuthorClick(topic.createdByMemberId);
              }
            }}
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              flexShrink: 0,
              cursor: onAuthorClick && topic.createdByMemberId ? 'pointer' : 'default',
            }}
          >
            {getInitial(authorName) || <PersonIcon sx={{ fontSize: 18 }} />}
          </Avatar>
          <Box sx={{ textAlign: 'left', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              onClick={(e) => {
                if (onAuthorClick && topic.createdByMemberId) {
                  e.stopPropagation();
                  onAuthorClick(topic.createdByMemberId);
                }
              }}
              sx={{
                lineHeight: 1.15,
                fontSize: { xs: '0.825rem', md: '0.875rem' },
                cursor: onAuthorClick && topic.createdByMemberId ? 'pointer' : 'default',
                '&:hover': onAuthorClick && topic.createdByMemberId ? { textDecoration: 'underline' } : {},
              }}
            >
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
