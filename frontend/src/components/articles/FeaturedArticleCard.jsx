import { Box, Typography } from '@mui/material';

const FeaturedArticleCard = ({ article }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
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
        }}
      >
        <Typography
          variant="h2"
          fontWeight={700}
          sx={{
            fontSize: { xs: '1.4rem', md: '2rem' },
          }}
        >
          {article.title}
        </Typography>

        <Typography sx={{ mt: 2 }}>
          {article.description}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          {article.date}
        </Typography>
      </Box>
    </Box>
  );
};

export default FeaturedArticleCard;