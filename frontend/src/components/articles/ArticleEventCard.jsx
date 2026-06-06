import { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const ArticleEventCard = ({ article, isAdmin = false, onEdit, onDelete, }) => {
  const [isInterested, setIsInterested] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 1,
        transition: 'transform 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* IMAGE */}
      <Box
        sx={{
          width: '100%',
          height: 180,
          borderRadius: 1,
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

      {/* MAIN INFO */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          gap: 0.5,
        }}
      >
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
            variant="h4"
            fontWeight={700}
            sx={{
              flex: 1,
              color: hovered ? 'primary.main' : 'text.primary',
              transition: 'color 0.2s ease',
            }}
          >
            {article.title}
          </Typography>

          <ArrowForwardIcon
            fontSize="small"
            sx={{
              mt: '3px',
              flexShrink: 0,
              color: 'primary.main',
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
          variant="body2"
          sx={{
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
        <Stack direction="row" spacing={1}>
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
        <Stack direction="row" spacing={1}>
          {/* INTEREST BUTTON */}
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

          {/* JOIN BUTTON */}
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
  );
};

export default ArticleEventCard;