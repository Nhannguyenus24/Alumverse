import { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const FeaturedArticleEventCard = ({ article, isAdmin = false, onEdit, onDelete, }) => {
  const [isInterested, setIsInterested] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        width: '100%',
        gap: 3,

        transition: 'transform 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* IMAGE */}
      <Box
        sx={{
          width: { xs: '100%', md: '45%' },
          height: { xs: 200, md: 250 },
          borderRadius: 2,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={article.image}
          alt={article.title}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
          }}
        />
      </Box>

      {/* CONTENT */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* INFO BLOCK */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* DATE */}
          <Typography
            variant="caption"
            sx={{ color: 'primary.main', fontWeight: 600 }}
          >
            {article.date}
          </Typography>

          {/* EVENT NAME */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 0.5,
            }}
          >
            <Typography
              variant="h2"
              fontWeight={700}
              sx={{
                flex: 1,
                fontSize: { xs: '1.4rem', md: '2rem' },

                color: hovered
                  ? 'primary.main'
                  : 'text.primary',

                transition: 'color 0.2s ease',
              }}
            >
              {article.title}
            </Typography>

            <ArrowForwardIcon
              sx={{
                mt: '6px',
                color: 'primary.main',
                flexShrink: 0,

                opacity: hovered ? 1 : 0,

                transform: hovered
                  ? 'translateX(0)'
                  : 'translateX(-6px)',

                transition:
                  'opacity 0.2s ease, transform 0.2s ease',
              }}
            />
          </Box>

          {/* ORGANIZER */}
          <Typography variant="body2" color="text.secondary">
            {article.organizer || 'Ban tổ chức'}
          </Typography>

          {/* STATS */}
          <Typography variant="caption" color="text.secondary">
            {article.participants || 0} người tham gia ·{' '}
            {article.interested || 0} người quan tâm
          </Typography>
        </Box>

        {/* DESCRIPTION */}
        <Typography
          sx={{
            mt: 1,

            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.description}
        </Typography>

        <Box sx={{ flex: 1 }} />

        {/* ACTION BUTTONS */}
        {isAdmin ? (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {/* EDIT BUTTON */}
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<EditOutlinedIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
              }}
              onClick={onEdit}
            >
              Sửa
            </Button>

            {/* DELETE BUTTON */}
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<DeleteOutlineOutlinedIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
              }}
              onClick={onDelete}
            >
              Xoá
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {/* INTEREST */}
            <Button
              fullWidth
              variant={isInterested ? 'outlined' : 'contained'}
              color="primary"
              sx={{
                bgcolor: isInterested ? 'white' : 'primary.main',
              }}
              onClick={() => setIsInterested(!isInterested)}
            >
              {isInterested ? 'Đã quan tâm' : 'Quan tâm'}
            </Button>

            {/* JOIN */}
            <Button
              fullWidth
              variant={isJoined ? 'outlined' : 'contained'}
              color="success"
              sx={{
                bgcolor: isJoined ? 'white' : 'success.main',
              }}
              onClick={() => setIsJoined(!isJoined)}
            >
              {isJoined ? 'Đã tham gia' : 'Tham gia'}
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default FeaturedArticleEventCard;