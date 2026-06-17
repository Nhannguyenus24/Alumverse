import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

const InfoRow = ({ icon: Icon, label, value }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        py: 1.75,
        px: 1,
        borderRadius: 2,
        transition: 'all .25s ease',

        '&::before': {
          content: '""',
          position: 'absolute',
          left: -8,
          top: '15%',
          width: 3,
          height: '70%',
          borderRadius: 999,
          bgcolor: 'primary.main',
          opacity: 0,
          transition: 'all .25s ease',
        },

        '&:hover': {
          transform: 'translateX(4px)',
        },

        '&:hover::before': {
          opacity: 1,
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
        {Icon && (
          <Icon
            sx={{
              fontSize: 18,
              color: 'primary.main',
            }}
          />
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          fontWeight={600}
        >
          {label}
        </Typography>
      </Stack>

      <Typography
        variant="body1"
        fontWeight={500}
        sx={{ ml: 3.5 }}
      >
        {value || 'Chưa cập nhật'}
      </Typography>
    </Box>
  );
};

export default InfoRow;