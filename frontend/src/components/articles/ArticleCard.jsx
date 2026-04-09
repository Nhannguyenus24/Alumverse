import { Box, Typography } from '@mui/material';

const ArticleCard = ({ article }) => {
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

      {/* TEXT */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="h4" fontWeight={700}>
          {article.title}
        </Typography>

        <Typography variant="body2">
          {article.description}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {article.date}
        </Typography>
      </Box>
    </Box>
  );
};

export default ArticleCard;