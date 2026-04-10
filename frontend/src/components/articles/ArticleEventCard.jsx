import { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';

const ArticleEventCard = ({ article }) => {
  const [isInterested, setIsInterested] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* IMAGE */}
      <Box
        component="img"
        src={article.image}
        alt={article.title}
        sx={{
          width: '100%',
          height: 180,
          objectFit: 'cover',
          borderRadius: 1,
        }}
      />

      {/* MAIN INFO */}
      <Box sx={{ display: 'flex', flexDirection: 'column'}}>
        {/* DATE */}
        <Typography
          variant="caption"
          sx={{ color: 'primary.main', fontWeight: 600 }}
        >
          {article.date}
        </Typography>

        {/* EVENT NAME */}
        <Typography variant="h4" fontWeight={700}>
          {article.title}
        </Typography>

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
      <Typography variant="body2">
        {article.description}
      </Typography>

      {/* ACTION BUTTONS */}
      <Stack direction="row" spacing={1}>
        {/* INTEREST BUTTON */}
        <Button
          fullWidth
          variant={isInterested ? 'outlined' : 'contained'}
          color="primary"
          onClick={() => setIsInterested(!isInterested)}
        >
          {isInterested ? 'Đã quan tâm' : 'Quan tâm'}
        </Button>

        {/* JOIN BUTTON */}
        <Button
          fullWidth
          variant={isJoined ? 'outlined' : 'contained'}
          sx={{
            bgcolor: isJoined ? 'transparent' : 'grey.700',
            color: isJoined ? 'grey.700' : 'common.white',
            '&:hover': {
              bgcolor: isJoined ? 'grey.100' : 'grey.500',
            },
          }}
          onClick={() => setIsJoined(!isJoined)}
        >
          {isJoined ? 'Đã tham gia' : 'Tham gia'}
        </Button>
      </Stack>
    </Box>
  );
};

export default ArticleEventCard;