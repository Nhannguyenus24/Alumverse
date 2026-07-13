import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography } from '@mui/material';

const AcademicCard = ({ icon: Icon, label, value }) => {
  const { t } = useTranslation('common');
  return (
    <Box
      sx={{
        p: 2.5,
        height: '100%',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'all .25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
          borderColor: 'primary.main',
        },
      }}
    >
      <Stack spacing={1.5}>
        {Icon && <Icon color="primary" />}

        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={700}
        >
          {label}
        </Typography>

        <Typography
          variant="body1"
          fontWeight={600}
        >
          {value || t('not_updated')}
        </Typography>
      </Stack>
    </Box>
  );
};


export default AcademicCard;