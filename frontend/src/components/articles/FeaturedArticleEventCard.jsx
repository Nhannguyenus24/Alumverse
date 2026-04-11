import { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';

const FeaturedArticleEventCard = ({ article }) => {
  const [isInterested, setIsInterested] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        width: '100%',
        gap: 3,
      }}
    >
      {/* IMAGE */}
      <Box
        component="img"
        src={article.image}
        alt={article.title}
        sx={{
          width: { xs: '100%', md: '45%' },
          height: { xs: 200, md: 250 },
          objectFit: 'cover',
          borderRadius: 2,
          flexShrink: 0,
        }}
      />

      {/* CONTENT */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
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
          <Typography
            variant="h2"
            fontWeight={700}
            sx={{ fontSize: { xs: '1.4rem', md: '2rem' } }}
          >
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
        <Typography sx={{ mt: 1 }}>
          {article.description}
        </Typography>

        {/* ACTION BUTTONS */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {/* INTEREST */}
          <Button
            fullWidth
            variant={isInterested ? 'outlined' : 'contained'}
            color="primary"
            onClick={() => setIsInterested(!isInterested)}
          >
            {isInterested ? 'Đã quan tâm' : 'Quan tâm'}
          </Button>

          {/* JOIN */}
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
    </Box>
  );
};

export default FeaturedArticleEventCard;