import { Box, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { formatRelativeTimeVi } from '../../utils/dateFormatter';

const ForumTopicListItem = ({ topic, activeCategory, categoryId, onClick }) => {
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
            Được tạo lúc · {formatRelativeTimeVi(topic.createdAt)}
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
            Lượt xem
          </Typography>
          <Typography variant="body2" fontWeight={800}>
            {topic.viewCount ?? 0}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: { xs: 56, sm: 72 } }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Thảo luận
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
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PersonIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" fontWeight={600}>
              Thành viên #{topic.createdByMemberId ?? '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatRelativeTimeVi(topic.updatedAt)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ForumTopicListItem;
