import { Box, Typography } from '@mui/material';

const StatsBanner = ({
  items = [],
  backgroundColor = 'primary.main',
}) => {
  if (!items.length) return null;

  return (
    <Box
      sx={{
        backgroundColor,
        borderRadius: 2,
        px: { xs: 3, md: 6 },
        py: { xs: 3, md: 4 },

        display: 'flex',
        flexWrap: 'wrap',

        '& > *': {
          flex: '1 1 200px',
          textAlign: 'center',
        },
      }}
    >
      {items.map((item) => (
        <Box key={item.label}>
          <Typography
            variant="h2"
            fontWeight={700}
            color="common.white"
          >
            {item.value}
          </Typography>

          <Typography
            variant="body2"
            color="common.white"
            sx={{ opacity: 0.9 }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default StatsBanner;