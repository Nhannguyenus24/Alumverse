import { Box, Divider, Typography } from '@mui/material';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import PersonIcon from '@mui/icons-material/Person';

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

const ForumBoardRow = ({ board }) => {
  const last = board?.lastPost;

  return (
    <Box sx={{ px: { xs: 1.5, sm: 1.75, md: 2.75 }, py: { xs: 1.5, sm: 2, md: 2.4 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: { xs: 1.75, md: 2.5 },
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
                lineHeight: 1.5,
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
            <StatCell label="Chuỗi bài" value={board?.threadCount ?? '-'} />
            <StatCell label="Thảo luận" value={board?.discussionCount ?? '-'} />
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
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
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {last?.title ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {last?.authorName ? `${last.authorName} • ` : ''}
                {last?.createdAt ?? ''}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              pl: 2,
            }}
          >
            <NotificationsNoneOutlinedIcon fontSize="small" />
          </Box>
        </Box>

        {/* Mobile extras */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 1.25 }}>
          <Divider sx={{ mb: 1.25 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <StatCell label="Chuỗi bài" value={board?.threadCount ?? '-'} />
              <StatCell label="Thảo luận" value={board?.discussionCount ?? '-'} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
              <NotificationsNoneOutlinedIcon fontSize="small" />
            </Box>
          </Box>
          <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PersonIcon sx={{ fontSize: 16 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {last?.title ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {last?.authorName ? `${last.authorName} • ` : ''}
                {last?.createdAt ?? ''}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ForumBoardRow;

